const Nife = require('nife');
const {
  defineTask,
  HTTPUtils,
} = require('mythix');

module.exports = defineTask('GarbageCollector', ({ application, Parent, time, Sequelize }) => {
  const Ops         = Sequelize.Op;
  const workerCount = application.getConfigValue('tasks.GarbageCollector.workers', 1, 'integer');

  const BATCH_MAX_LIVE_TIME       = time.days(30).totalMilliseconds();
  const REQUEST_MAX_LIVE_TIME     = time.days(30).totalMilliseconds();
  const CACHE_MAX_LIVE_TIME       = time.days(30).totalMilliseconds();
  const DOMAIN_META_MAX_LIVE_TIME = time.days(30).totalMilliseconds();

  return class GarbageCollector extends Parent {
    static workers    = workerCount;
    static frequency  = time.days(1);
    static startDelay = time.minutes(30);
    static keepAlive  = true;
    static enabled    = true;

    async deleteStaleBatchRecords(Batch) {
      var now             = Date.now();
      var oldRequestTime  = new Date(now - BATCH_MAX_LIVE_TIME);

      var query = {
        lockedAt: {
          [Ops.is]: null,
        },
        [Ops.or]: [
          {
            // We hit max failures a month ago
            updatedAt:    { [Ops.lte]: oldRequestTime },
            failCount:    { [Ops.gte]: 5 },
            completedAt:  { [Ops.is]: null },
          },
          {
            // We succeeded a month ago
            updatedAt:        { [Ops.lte]: oldRequestTime },
            completedAt:      { [Ops.not]: null },
          },
        ],
      };

      return await this.getDBConnection().transaction(async (transaction) => {
        await Batch.destroy({
          where: query,
          transaction,
        });
      });
    }

    async deleteStaleRequestRecords(Request) {
      var now             = Date.now();
      var oldRequestTime  = new Date(now - REQUEST_MAX_LIVE_TIME);

      var query = {
        lockedAt: {
          [Ops.is]: null,
        },
        [Ops.or]: [
          {
            // We hit max failures a month ago
            updatedAt:    { [Ops.lte]: oldRequestTime },
            failCount:    { [Ops.gte]: 5 },
            completedAt:  { [Ops.is]: null },
          },
          {
            // We succeeded a month ago
            updatedAt:        { [Ops.lte]: oldRequestTime },
            completedAt:      { [Ops.not]: null },
          },
        ],
      };

      return await this.getDBConnection().transaction(async (transaction) => {
        await Request.destroy({
          where: query,
          transaction,
        });
      });
    }

    async getCacheIDsToDelete(CacheAccess) {
      const meetsMinimumCacheTime = (groups, counts, cacheID) => {
        for (var i = groups.length - 1; i >= 0; i--) {
          var group       = groups[i];
          var groupName   = group.name;
          var groupCounts = counts[groupName];
          var cacheCount  = ((groupCounts) ? groupCounts[cacheID] : 0) || 0;

          if (cacheCount < group.minimum)
            return false;
        }

        return true;
      };

      var now               = Date.now();
      var oldCacheTime      = new Date(now - CACHE_MAX_LIVE_TIME);
      var counts            = {};
      var groups            = [
        {
          name:     'lastWeek',
          time:     now - time.days(7).totalMilliseconds(),
          minimum:  1,
        },
        {
          name:     'lastTwoWeeks',
          time:     now - time.days(14).totalMilliseconds(),
          minimum:  5,
        },
        {
          name:     'lastThreeWeeks',
          time:     now - time.days(21).totalMilliseconds(),
          minimum:  10,
        },
        {
          name:     'lastMonth',
          time:     now - CACHE_MAX_LIVE_TIME,
          minimum:  15,
        },
      ];

      var query = {
        createdAt: {
          [Ops.gte]: oldCacheTime,
        },
      };

      // Fetch cache access records, and group them
      // according to time

      var cacheAccessRecords = (await CacheAccess.all(query, {
        attributes: [ 'createdAt', 'cache' ],
      })).map((model) => ({ createdAt: model.createdAt, cacheID: model.cache }));

      for (var i = 0, il = cacheAccessRecords.length; i < il; i++) {
        var cacheAccess = cacheAccessRecords[i];
        var timestamp   = cacheAccess.createdAt.valueOf();
        var cacheID     = cacheAccess.cacheID;

        for (var j = 0, jl = groups.length; j < jl; j++) {
          var group       = groups[j];
          var groupName   = group.name;
          var groupCounts = counts[groupName];

          if (!groupCounts)
            groupCounts = counts[groupName] = {};


          // Does this belong in this group?
          if (timestamp < group.time) {
            groupCounts[cacheID] = 0;
            continue;
          }

          var currentCount = groupCounts[cacheID] || 0;
          groupCounts[cacheID] = currentCount + 1;
        }
      }

      // Now find out if any ids need to be deleted based on their grouping
      var cacheIDsToDelete = cacheAccessRecords.map((record) => record.cacheID).filter((cacheID) => !meetsMinimumCacheTime(groups, counts, cacheID));

      return cacheIDsToDelete;
    }

    async deleteStaleCacheRecords(Cache, CacheAccess) {
      var cacheIDsToDelete = await this.getCacheIDsToDelete(CacheAccess);

      return await this.getDBConnection().transaction(async (transaction) => {
        var now           = Date.now();
        var oldCacheTime  = new Date(now - CACHE_MAX_LIVE_TIME);

        // First, delete cache ids that haven't met the mimimum cache time
        await Cache.destroy({
          where: {
            id: {
              [Ops.in]: cacheIDsToDelete,
            },
          },
          transaction,
        });

        // Second, delete all caches that are older than one month
        await Cache.destroy({
          where: {
            updatedAt: {
              [Ops.lte]: oldCacheTime,
            },
          },
          transaction,
        });
      });
    }

    async deleteStaleDomainMetaRecords(DomainMeta) {
      return await this.getDBConnection().transaction(async (transaction) => {
        var now               = Date.now();
        var oldDomainMetaTime = new Date(now - DOMAIN_META_MAX_LIVE_TIME);

        await DomainMeta.destroy({
          where: {
            createdAt: {
              [Ops.lte]: oldDomainMetaTime,
            },
          },
          transaction,
        });
      });
    }

    async execute() {
      var {
        Batch,
        Request,
        Cache,
        CacheAccess,
        DomainMeta,
      } = this.getModels();

      await this.deleteStaleBatchRecords(Batch);
      await this.deleteStaleRequestRecords(Request);
      await this.deleteStaleCacheRecords(Cache, CacheAccess);
      await this.deleteStaleDomainMetaRecords(DomainMeta);
    }
  };
});
