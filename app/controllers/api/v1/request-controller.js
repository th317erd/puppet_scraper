const Nife                  = require('nife');
const { defineController }  = require('mythix');
const { RequestBase }       = require('./request-controller-base');

module.exports = defineController('RequestControllerV1', ({ Parent }) => {
  return class RequestControllerV1 extends Parent {
    async getRequest(params) {
      var { requestID } = params;
      if (Nife.isEmpty(requestID))
        this.throwBadRequestError('"requestID" required');

      var currentUser = this.request.user;

      const Request = this.getModel('Request');

      var request = await Request.first({ id: requestID, user: currentUser.id });
      if (!request)
        this.throwNotFoundError();

      return request;
    }

    getStatus(model) {
      var status;

      if (model.lockedAt)
        status = 'pending';
      else if (model.failedAt)
        status = 'error';
      else if (model.completedAt)
        status = 'success';
      else
        status = 'pending';

      return status;
    }

    async requestStatus({ params }) {
      var request = await this.getRequest(params);
      var status  = this.getStatus(request);

      var response = { requestID: request.id, status };
      if (status === 'error' && request.errorMessage)
        response.errorMessage = request.errorMessage;

      return response;
    }

    async requestBatch({ params }, { Request, Batch }) {
      var currentUser = this.request.user;

      var request = await this.getRequest(params);
      var batch   = await Batch.first({ id: request.batch, user: currentUser.id });
      if (!batch)
        this.throwNotFoundError();

      var requestIDs = await this.getRequestIDsFromBatches(Request, currentUser, batch);

      var status    = this.getStatus(batch);
      var response  = {
        batchID:                  batch.id,
        doneAcceptingRequestsAt:  batch.doneAcceptingRequestsAt || null,
        markedReceivedAt:         batch.markedReceivedAt || null,
        completedAt:              batch.completedAt || null,
        failedAt:                 batch.failedAt || null,
        requestIDs:               requestIDs[batch.id],
        status,
      };

      if (status === 'error' && batch.errorMessage)
        response.errorMessage = batch.errorMessage;

      return response;
    }

    async getRequestContent({ params }, { Cache, CacheAccess }) {
      var currentUser = this.request.user;
      var request     = await this.getRequest(params);
      var requestInfo = await request.getRequestInfo();

      if (!requestInfo)
        this.throwInternalServerError(`"requestInfo" not found for Request.id == "${request.id}"`);

      var cache = await Cache.first({ requestInfo: requestInfo.id }, [[ 'updatedAt', 'DESC' ]]);
      if (!cache) {
        this.response.status(204).send('No Content');
        return;
      }

      // Create cache access records for these caches
      await this.createCacheAccessRecords(CacheAccess, currentUser, [ cache ]);

      return { requestID: request.id, content: cache.rawContent, updatedAt: cache.updatedAt };
    }

  };
}, RequestBase);
