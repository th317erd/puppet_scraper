const Nife                  = require('nife');
const { ControllerBase }    = require('mythix');
const { URL }               = require('url');

class RequestBase extends ControllerBase {
  buildRequestInfoModels(_incomingRequests) {
    const buildRequestInfo = (incomingRequest) => {
      var {
        method,
        url,
      } = incomingRequest;

      var fullURL = new URL(url);

      var scheme  = (fullURL.protocol || '').replace(/:+$/, '');
      var host    = fullURL.hostname || null;
      var port    = fullURL.port || null;
      var path    = fullURL.pathname || null;
      var query   = fullURL.search || null;

      if (Nife.isEmpty(host))
        throw new Error('"host" is required');

      if (Nife.isEmpty(scheme))
        scheme = 'https';

      if (Nife.isEmpty(port))
        port = (scheme === 'https') ? 443 : 80;
      else
        port = Nife.coerceValue(port, 'integer');

      if (Nife.isEmpty(path))
        path = '/';

      var requestInfoModelAttributes = {
        method,
        url,
        scheme,
        host,
        port,
        path,
        query,
      };

      return requestInfoModelAttributes;
    };

    var incomingRequests = Nife.toArray(_incomingRequests);
    return incomingRequests.map(buildRequestInfo);
  }

  async getCacheModelsFromRequestInfos(Cache, requestInfos) {
    return await Cache.getCacheModelsFromRequestInfos(requestInfos);
  }

  async getOrCreateRequestInfoModels(RequestInfo, requestInfos) {
    return await RequestInfo.getOrCreateMultipleRequestInfos(requestInfos);
  }

  async createCacheAccessRecords(CacheAccess, currentUser, caches) {
    return await CacheAccess.createCacheAccessRecords(currentUser, caches);
  }

  async getRequestIDsFromRequestInfos(Request, currentUser, requestInfos, batch) {
    // Batch here isn't required, but is used only as a "hint"
    return await Request.getRequestIDsFromRequestInfos(currentUser, requestInfos, batch);
  }

  async getRequestIDsFromBatches(Request, currentUser, batches) {
    return await Request.getRequestIDsFromBatches(currentUser, batches);
  }
}

module.exports = {
  RequestBase,
};
