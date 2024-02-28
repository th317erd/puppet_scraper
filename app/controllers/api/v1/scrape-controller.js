const Nife                  = require('nife');
const { defineController }  = require('mythix');
const { RequestBase }       = require('./request-controller-base');

module.exports = defineController('ScrapeControllerV1', ({ Parent }) => {
  return class ScrapeControllerV1 extends Parent {
    async createOrUpdateBatch(body, currentUser, _batch, { Batch, RequestInfo, Request, Cache, CacheAccess }) {
      if (Nife.isEmpty(body.requests))
        this.throwBadRequestError('"requests" required');

      // Get or create requestInfo models
      var requestInfos = await this.getOrCreateRequestInfoModels(RequestInfo, this.buildRequestInfoModels(body.requests));

      var batch = _batch;

      // Create batch
      await this.getDBConnection().transaction(async (transaction) => {
        if (!batch) {
          batch = await Batch.create({
            doneAcceptingRequestsAt:  (body.finalize === true) ? new Date() : null,
            user:                     currentUser.id,
          }, { transaction });
        }

        // Create and return requests
        await Request.bulkCreate(requestInfos.map((requestInfo) => {
          return {
            requestInfo:  requestInfo.id,
            user:         currentUser.id,
            batch:        batch.id,
          };
        }), { transaction });
      });

      var requestIDs = await this.getRequestIDsFromBatches(Request, currentUser, batch);

      return {
        batchID:                  batch.id,
        status:                   'pending',
        createdAt:                batch.createdAt,
        updatedAt:                batch.updatedAt,
        doneAcceptingRequestsAt:  batch.doneAcceptingRequestsAt || null,
        markedReceivedAt:         batch.markedReceivedAt || null,
        completedAt:              batch.completedAt || null,
        failedAt:                 batch.failedAt || null,
        requestIDs:               requestIDs[batch.id],
      };
    }

    // Create a new batch
    async createBatch({ body }, models) {
      return await this.createOrUpdateBatch(body, this.request.user, null, models);
    }

    // Add more requests to a batch
    async addToBatch({ params, body }, models) {
      var { batchID } = params;
      if (Nife.isEmpty(batchID))
        this.throwBadRequestError('"batchID" required');

      const { Batch } = models;

      var currentUser = this.request.user;

      var batch = await Batch.first({ id: batchID, user: currentUser.id });
      if (!batch)
        this.throwNotFoundError();

      // Clear doneAcceptingRequestsAt if set, so we can keep processing
      if (batch.doneAcceptingRequestsAt || batch.markedReceivedAt)
        await batch.update({ doneAcceptingRequestsAt: null, markedReceivedAt: null });

      return await this.createOrUpdateBatch(body, currentUser, batch, models);
    }

    // Mark a batch as "finalized" (no more requests will be added)
    async finalizeBatch({ params }, { Batch, Request }) {
      var { batchID } = params;
      if (Nife.isEmpty(batchID))
        this.throwBadRequestError('"batchID" required');

      var currentUser = this.request.user;

      var batch = await Batch.first({ id: batchID, user: currentUser.id });
      if (!batch)
        this.throwNotFoundError();

      if (!batch.doneAcceptingRequestsAt)
        await batch.update({ doneAcceptingRequestsAt: new Date() });

      var requestIDs = await this.getRequestIDsFromBatches(Request, currentUser, batch);

      return {
        batchID:                  batch.id,
        status:                   'finalized',
        createdAt:                batch.createdAt,
        updatedAt:                batch.updatedAt,
        doneAcceptingRequestsAt:  batch.doneAcceptingRequestsAt || null,
        markedReceivedAt:         batch.markedReceivedAt || null,
        completedAt:              batch.completedAt || null,
        failedAt:                 batch.failedAt || null,
        requestIDs:               requestIDs[batch.id],
      };
    }

    // Get batches that are still processing
    async pendingBatches({ query }, { Batch, Request }) {
      var { limit, offset } = query;

      var currentUser = this.request.user;
      var query       = {
        user:         currentUser.id,
        completedAt:  null,
      };

      var totalCount = await Batch.rowCount(query);

      var batches = await Batch.all(query, { limit, offset });

      if (Nife.isEmpty(batches))
        return { total: 0, batches: [] };

      var requestIDs = await this.getRequestIDsFromBatches(Request, currentUser, batches);

      var response = { total: totalCount };

      response.batches = batches.map((batch) => {
        return {
          batchID:                  batch.id,
          status:                   'pending',
          createdAt:                batch.createdAt,
          updatedAt:                batch.updatedAt,
          doneAcceptingRequestsAt:  batch.doneAcceptingRequestsAt || null,
          markedReceivedAt:         batch.markedReceivedAt || null,
          completedAt:              batch.completedAt || null,
          failedAt:                 batch.failedAt || null,
          requestIDs:               requestIDs[batch.id] || [],
        };
      });

      return response;
    }

    // Get batches that haven't been marked by the client as "received"
    async unreceivedBatches({ query }, { Batch, Request }) {
      var { limit, offset } = query;

      var currentUser = this.request.user;
      var query       = {
        'user':             currentUser.id,
        '!completedAt':     null,
        'markedReceivedAt': null,
      };

      var totalCount = await Batch.rowCount(query);

      var batches = await Batch.all(query, { limit, offset });

      if (Nife.isEmpty(batches))
        return { total: 0, batches: [] };

      var requestIDs = await this.getRequestIDsFromBatches(Request, currentUser, batches);

      var response = { total: totalCount };

      response.batches = batches.map((batch) => {
        return {
          batchID:                  batch.id,
          status:                   'pending',
          createdAt:                batch.createdAt,
          updatedAt:                batch.updatedAt,
          doneAcceptingRequestsAt:  batch.doneAcceptingRequestsAt || null,
          markedReceivedAt:         batch.markedReceivedAt || null,
          completedAt:              batch.completedAt || null,
          failedAt:                 batch.failedAt || null,
          requestIDs:               requestIDs[batch.id] || [],
        };
      });

      return response;
    }

    // Mark batches as "received"
    async markReceivedBatches({ body }, { Batch }) {
      var { batchIDs, received } = body;
      if (Nife.isEmpty(batchIDs))
        this.throwBadRequestError('"batchIDs" required');

      if (typeof received !== 'boolean')
        received = true;

      var currentUser = this.request.user;
      var query       = {
        'id':               batchIDs,
        'user':             currentUser.id,
        '!completedAt':     null,
        'lockedAt':         null,
      };

      if (received)
        query['markedReceivedAt'] = null;
      else
        query['!markedReceivedAt'] = null;

      await this.getDBConnection().transaction(async (transaction) => {
        return await Batch.update({ markedReceivedAt: (received) ? new Date() : null }, {
          where:      Batch.where(query),
          lock:       transaction.LOCK.UPDATE,
          transaction,
        });
      });

      return { status: (received) ? 'received' : 'unreceived', batchIDs };
    }

    // Get scraped results from batch
    async getBatchContent({ params, query }, { Batch, Request, Cache, RequestInfo, CacheAccess }) {
      var { batchID } = params;
      if (Nife.isEmpty(batchID))
        this.throwBadRequestError('"batchID" required');

      const notReady = () => {
        this.response.status(204).send('No Content');
      };

      var { limit, offset } = query;

      var currentUser = this.request.user;

      var batch = await Batch.first({
        'id':                       batchID,
        'user':                     currentUser.id,
      });

      if (!batch)
        this.throwNotFoundError();

      // There is no content to serve up (yet)
      if (!batch.doneAcceptingRequestsAt) {
        return notReady();
      }

      var query = {
        'batch':        batch.id,
        'user':         currentUser.id,
        '!completedAt': null,
        'lockedAt':     null,
      };

      var totalRequestCount = await Request.rowCount({ batch: batch.id, user: currentUser.id });
      if (totalRequestCount === 0)
        return { total: 0, content: [] };

      var finishedRequestCount  = await Request.rowCount(query, { limit, offset });

      // Requests are still processing
      if (!this.request.query.limit && totalRequestCount !== finishedRequestCount) {
        return notReady();
      }

      var requestInfoIDs  = Nife.pluck('requestInfo', await Request.all(query, { attributes: [ 'requestInfo' ], limit, offset }));
      var requestInfos    = await RequestInfo.all({ id: requestInfoIDs }, { attributes: [ 'id', 'method', 'url' ] });
      var caches          = await this.getCacheModelsFromRequestInfos(Cache, requestInfos);

      // If we are missing caches, then we are not ready
      if (caches && caches.length < requestInfoIDs.length) {
        return notReady();
      }

      // Create lookup map for quick finding
      var cacheLookup = Nife.toLookup('requestInfo', caches);

      // Create cache access records for these caches
      await this.createCacheAccessRecords(CacheAccess, currentUser, caches);

      var response = { total: totalRequestCount };

      response.content = requestInfos.map((requestInfo) => {
        var cache = cacheLookup[requestInfo.id];

        return {
          method:     requestInfo.method,
          url:        requestInfo.url,
          content:    cache.rawContent,
          updatedAt:  cache.updatedAt,
        };
      });

      return response;
    }

  };
}, RequestBase);
