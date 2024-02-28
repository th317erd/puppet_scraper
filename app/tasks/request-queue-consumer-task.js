const Nife                = require('nife');
const { defineTask }      = require('mythix');
const Puppeteer           = require('puppeteer');
const { getNextRetryAt }  = require('./task-utils');

module.exports = defineTask('RequestQueueConsumer', ({ application, Parent, time, Sequelize }) => {
  const Ops               = Sequelize.Op;
  const workerCount       = application.getConfigValue('tasks.RequestQueueConsumer.workers', 1, 'integer');
  const CHROME_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36';

  return class RequestQueueConsumer extends Parent {
    static workers    = workerCount;
    static frequency  = time.seconds(4 * workerCount);
    static keepAlive  = true;
    static enabled    = true;

    constructor(...args) {
      super(...args);

      Object.defineProperties(this, {
        'ready': {
          writable:     true,
          enumberable:  false,
          configurable: true,
          value:        false,
        },
        'browser': {
          writable:     true,
          enumberable:  false,
          configurable: true,
          value:        null,
        },
      });
    }

    async start() {
      await super.start();

      this.browser = await Puppeteer.launch({
        handleSIGINT:   false,
        handleSIGTERM:  false,
        handleSIGHUP:   false,
      });

      this.ready = true;
    }

    async stop() {
      await super.stop();

      const Request = this.getModel('Request');
      await this.clearLocks(Request, null, false);

      if (!this.browser)
        return;

      await browser.close();

      this.ready = false;
    }

    getNextRetryAt(retryCount) {
      return getNextRetryAt(retryCount);
    }

    getNeedProcessingQuery(Request) {
      var now           = Date.now();
      var twoHoursAgo   = new Date(Date.now() - time.hours(2).totalMilliseconds());

      return Request.where({
        [Ops.or]: [
          { lockedAt: null },
          { lockedAt: { [Ops.lte]: twoHoursAgo } },
        ],
        completedAt:  null,
        failCount: {
          [Ops.lt]: 5,
        },
        nextRetryAtMS: {
          [Ops.lte]: now,
        },
      });
    }

    async getNeedProcessingTaskCount(Request) {
      return await Request.count({
        where:      this.getNeedProcessingQuery(Request),
        distinct:   true,
        skipLocked: true,
      });
    }

    async getRequestsToProcess(Request) {
      var count = await this.getNeedProcessingTaskCount(Request);
      if (count === 0)
        return;

      // Work on 25% of this workers load (per-pass)
      count = Math.floor((count / this.getNumberOfWorkers()) * 0.25);
      if (count < 5)
        count = 5;

      await this.getDBConnection().transaction(async (transaction) => {
        await Request.bulkUpdate({ lockedAt: new Date(), lockedBy: this.getRunID() }, {
          where: this.getNeedProcessingQuery(Request),
          transaction: transaction,
          lock: {
            level: transaction.LOCK.UPDATE,
            of:    Request,
          },
          limit: count,
        });
      });

      return await Request.all({
        'lockedBy':     this.getRunID(),
        'completedAt':  null,
        '!lockedAt':    null,
      });
    }

    async clearLocks(Request, error, success, ids, extraAttrs) {
      var dbConnection = this.getDBConnection();
      await dbConnection.transaction(async (transaction) => {
        var attrs = { lockedAt: null, lockedBy: null };
        var now   = new Date();

        if (error) {
          attrs.errorMessage  = error.slice(0, 255);
          attrs.failedAt      = now;
          attrs.failCount     = dbConnection.literal('fail_count + 1');
          attrs.status        = 'error';
        } else if (success) {
          attrs.completedAt   = now;
          attrs.failCount     = 0;
          attrs.errorMessage  = null;
          attrs.failedAt      = null;
          attrs.status        = 'success';
        }

        if (Nife.isNotEmpty(extraAttrs))
          Object.assign(attrs, extraAttrs);

        await Request.update(attrs, {
          where: Request.where({
            id:           ids,
            lockedBy:     this.getRunID(),
            completedAt:  null,
            lockedAt: {
              [Ops.not]:  null,
            },
          }),
          transaction: transaction,
          lock: {
            level: transaction.LOCK.UPDATE,
            of:    Request,
          },
        });
      });
    }

    async getOrCreateDomainMeta(DomainMeta, requestInfo) {
      var domainMeta = await DomainMeta.first({
        domain: requestInfo.host,
      });

      if (!domainMeta) {
        domainMeta = await DomainMeta.create({
          domain:       requestInfo.host,
          lastRequestAtMS: BigInt(Date.now()),
          rateLimitMS:  100,
        });
      }

      return domainMeta;
    }

    async getPageContent(request, requestInfo, domainMeta) {
      try {
        var browser = this.browser;
        var page    = await browser.newPage();

        page.setUserAgent(domainMeta.userAgent || CHROME_USER_AGENT);

        await page.goto(requestInfo.url, { waitUntil: 'domcontentloaded' });

        // Give a little time for the page javascript to run
        await Nife.sleep(250);

        var content = await page.content();

        await page.close();

        return { status: 'success', value: content, request, requestInfo };
      } catch (error) {
        return { status: 'error', value: error, request, requestInfo };
      }
    }

    async getCacheModel(Cache, requestInfo) {
      return await Cache.first({
        requestInfo: requestInfo.id,
      }, {
        order: [[ 'updatedAt', 'DESC' ]],
        col: 'requestInfo',
        distinct: true,
      });
    }

    async createOrUpdateCacheModels(Cache, results) {
      await this.getDBConnection().transaction(async (transaction) => {
        var requestInfoLookup = Nife.toLookup('requestInfo.id', results);
        var caches            = await Cache.all({ requestInfo: Object.keys(requestInfoLookup) }, { attributes: [ 'id', 'requestInfo' ] });
        var updated           = {};

        // Update caches that already exist
        var promises = caches.map((cache) => {
          var result = requestInfoLookup[cache.requestInfo];

          updated[cache.requestInfo] = true;

          return cache.update({ rawContent: result.value }, { transaction });
        });

        await Promise.all(promises);

        // Create caches that don't yet exist
        var cacheModels = results.filter((result) => !updated[result.requestInfo.id]).map((result) => {
          return { rawContent: result.value, requestInfo: result.requestInfo.id };
        });

        if (Nife.isNotEmpty(cacheModels))
          await Cache.bulkCreate(cacheModels, { transaction });
      });
    }

    async handleResults(results, { Request, Cache }) {
      const getPromiseResults = (results) => {
        return results.map((result) => result.value);
      };

      const getSuccessResults = (results) => {
        return getPromiseResults(results).filter((result) => (result.status === 'success'));
      };

      const getFailedResults = (results) => {
        return getPromiseResults(results).filter((result) => (result.status === 'error'));
      };

      // Update cache table, and clear locks for successful responses
      var successResults = getSuccessResults(results);
      var failedResults = getFailedResults(results);

      if (successResults.length === 0 && failedResults.length === 0) {
        await this.clearLocks(Request, null, false);
        return;
      }

      if (Nife.isNotEmpty(successResults)) {
        var requestIDs = successResults.map((result) => result.request.id);
        await this.createOrUpdateCacheModels(Cache, successResults);
        await this.clearLocks(Request, null, true, requestIDs);
      }

      // If there are failed results, then clear the locks for each row
      // and set the error message and failed at time for each failure
      if (Nife.isNotEmpty(failedResults)) {
        for (var i = 0, il = failedResults.length; i < il; i++) {
          var result    = failedResults[i];
          var error     = result.value;
          var request   = result.request;
          var failCount = request.failCount;

          if (error instanceof Error)
            error = error.message;

          await this.clearLocks(
            Request,
            ('' + error),
            false,
            [ result.request.id ],
            { nextRetryAtMS: this.getNextRetryAt(failCount + 1) }
          );
        }
      }
    }

    async execute() {
      if (!this.ready || !this.browser)
        return;

      const domainRateLimitApplies = (domainMeta) => {
        if (!domainMeta.lastRequestAtMS)
          return false;

        if (!domainMeta.rateLimitMS)
          return false;

        var now = BigInt(Date.now());
        return ((now - domainMeta.lastRequestAtMS) < BigInt(domainMeta.rateLimitMS));
      };

      var {
        Request,
        DomainMeta,
        Cache,
      } = this.getModels();

      try {
        var requests = await this.getRequestsToProcess(Request);
        if (!requests || !requests.length)
          return;

        var promises = [];

        for (var i = 0, il = requests.length; i < il; i++) {
          var request     = requests[i];
          var requestInfo = await request.getRequestInfo();

          // Did we fail to get the requestInfo?
          if (!requestInfo) {
            promises.push(Promise.resolve({ status: 'error', value: 'No RequestInfo found', request, requestInfo }));
            continue;
          }

          // Do we have cache?
          var cache = await this.getCacheModel(Cache, requestInfo);
          if (cache) {
            promises.push(Promise.resolve({ status: 'success', value: cache.rawContent, request, requestInfo }));
            continue;
          }

          // Get domain information, and ensure we aren't
          // exceeding the rate limit for this domain
          var domainMeta = await this.getOrCreateDomainMeta(DomainMeta, requestInfo);
          if (domainRateLimitApplies(domainMeta))
            continue;

          // Scarf page using Puppeteer
          var promise = this.getPageContent(request, requestInfo, domainMeta);
          promises.push(promise);
        }

        // This will also clear any locks
        await this.handleResults(await Promise.allSettled(promises), { Request, Cache });
      } catch (error) {
        this.getLogger().error(`Error while executing "RequestQueue" task`, error);
        await this.clearLocks(Request, error.message, false);
      }
    }
  };
});
