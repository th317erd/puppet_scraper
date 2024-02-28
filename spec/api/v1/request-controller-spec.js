const { newTestApplication, UUID_REGEXP } = require('../../support/application');

describe('BatchController', function() {
  var app;
  var models;

  beforeAll(async () => {
    app = await newTestApplication();
    models = app.getModels();
  });

  afterAll(async () => {
    await app.stop();
  });

  afterEach(async () => {
    await app.truncateAllTables([ 'User' ]);
  });

  // -------------------- fail -------------------- //

  describe('unauthorized', () => {
    it('should fail when unauthorized', async () => {
      var urls = [
        { method: 'get',  url: '/api/v1/request/derp/status' },
        { method: 'get',  url: '/api/v1/request/derp/batch' },
        { method: 'get',  url: '/api/v1/request/derp/content' },
      ];

      for (var i = 0, il = urls.length; i < il; i++) {
        var { method, url } = urls[i];

        var result = await app[method]('/api/v1/scrape', { headers: { 'Authorization': null } });
        expect(result.statusCode).toEqual(401);
        expect(result.body).toEqual("Unauthorized");
      }
    });
  });

  it('should fail on bad content-type', async () => {
    var result = await app.get('/api/v1/request/derp/status', { headers: { 'Content-Type': 'text/plain' } });
    expect(result.statusCode).toEqual(400);
    expect(result.body).toEqual("Bad Request: Accepted Content-Types are [ 'application/json' ]");
  });

  it('should fail on bad request (status)', async () => {
    var result = await app.get('/api/v1/request/derp/status');
    expect(result.statusCode).toEqual(404);
    expect(result.body).toEqual('Not Found');
  });

  it('should fail on bad request (batch)', async () => {
    var result = await app.get('/api/v1/request/derp/batch');
    expect(result.statusCode).toEqual(404);
    expect(result.body).toEqual('Not Found');
  });

  it('should fail on bad request (content)', async () => {
    var result = await app.get('/api/v1/request/derp/content');
    expect(result.statusCode).toEqual(404);
    expect(result.body).toEqual('Not Found');
  });

  // -------------------- status -------------------- //

  describe('status', () => {
    it('should be able to get status on request (pending)', async () => {
      expect(await models.Request.rowCount()).toEqual(0);
      expect(await models.Batch.rowCount()).toEqual(0);

      var result = await app.post('/api/v1/scrape', {
        data: {
          requests: [
            { method: 'GET', url: 'http://example.com/' },
          ],
        },
      });

      expect(result.statusCode).toEqual(200);

      result = result.body;

      expect(await models.Request.rowCount()).toEqual(1);
      expect(await models.Batch.rowCount()).toEqual(1);

      var requestIDs = result.requestIDs;
      expect(requestIDs).toBeInstanceOf(Array);
      expect(requestIDs.length).toEqual(1);
      expect(requestIDs[0]).toMatch(UUID_REGEXP);

      var requestID = requestIDs[0];

      result = await app.get(`/api/v1/request/${requestID}/status`);

      expect(result.statusCode).toEqual(200);

      result = result.body;

      expect(result.requestID).toEqual(requestID);
      expect(result.status).toEqual('pending');
    });

    it('should be able to get status on request (locked)', async () => {
      expect(await models.Request.rowCount()).toEqual(0);
      expect(await models.Batch.rowCount()).toEqual(0);

      var result = await app.post('/api/v1/scrape', {
        data: {
          requests: [
            { method: 'GET', url: 'http://example.com/' },
          ],
        },
      });

      expect(result.statusCode).toEqual(200);

      result = result.body;

      var requestID = result.requestIDs[0];

      var request = await models.Request.first({ id: requestID });
      await request.update({ completedAt: new Date(), lockedAt: new Date() });

      result = await app.get(`/api/v1/request/${requestID}/status`);

      expect(result.statusCode).toEqual(200);

      result = result.body;

      expect(result.requestID).toEqual(requestID);
      expect(result.status).toEqual('pending');
    });

    it('should be able to get status on request (error)', async () => {
      expect(await models.Request.rowCount()).toEqual(0);
      expect(await models.Batch.rowCount()).toEqual(0);

      var result = await app.post('/api/v1/scrape', {
        data: {
          requests: [
            { method: 'GET', url: 'http://example.com/' },
          ],
        },
      });

      expect(result.statusCode).toEqual(200);

      result = result.body;

      var requestID = result.requestIDs[0];

      var request = await models.Request.first({ id: requestID });
      await request.update({ failedAt: new Date(), errorMessage: 'Some error' });

      result = await app.get(`/api/v1/request/${requestID}/status`);

      expect(result.statusCode).toEqual(200);

      result = result.body;

      expect(result.requestID).toEqual(requestID);
      expect(result.status).toEqual('error');
      expect(result.errorMessage).toEqual('Some error');
    });

    it('should be able to get status on request (success)', async () => {
      expect(await models.Request.rowCount()).toEqual(0);
      expect(await models.Batch.rowCount()).toEqual(0);

      var result = await app.post('/api/v1/scrape', {
        data: {
          requests: [
            { method: 'GET', url: 'http://example.com/' },
          ],
        },
      });

      expect(result.statusCode).toEqual(200);

      result = result.body;

      var requestID = result.requestIDs[0];

      var request = await models.Request.first({ id: requestID });
      await request.update({ completedAt: new Date() });

      result = await app.get(`/api/v1/request/${requestID}/status`);

      expect(result.statusCode).toEqual(200);

      result = result.body;

      expect(result.requestID).toEqual(requestID);
      expect(result.status).toEqual('success');
    });
  });

  // -------------------- status -------------------- //

  describe('batch', () => {
    it('should be able to get request batch (pending)', async () => {
      expect(await models.Request.rowCount()).toEqual(0);
      expect(await models.Batch.rowCount()).toEqual(0);

      var result = await app.post('/api/v1/scrape', {
        data: {
          requests: [
            { method: 'GET', url: 'http://example.com/' },
          ],
        },
      });

      expect(result.statusCode).toEqual(200);

      result = result.body;

      expect(await models.Request.rowCount()).toEqual(1);
      expect(await models.Batch.rowCount()).toEqual(1);

      var batchID   = result.batchID;
      var requestID = result.requestIDs[0];

      result = await app.get(`/api/v1/request/${requestID}/batch`);

      expect(result.statusCode).toEqual(200);

      result = result.body;

      expect(result.batchID).toEqual(batchID);
      expect(result.status).toEqual('pending');
      expect(result.createdAt).not.toBe(null);
      expect(result.updatedAt).not.toBe(null);
      expect(result.updatedAt).not.toBe(null);
      expect(result.doneAcceptingRequestsAt).toBe(null);
      expect(result.markedReceivedAt).toBe(null);
      expect(result.completedAt).toBe(null);
      expect(result.failedAt).toBe(null);
      expect(result.requestIDs).toBeInstanceOf(Array);
      expect(result.requestIDs.length).toEqual(1);
      expect(result.requestIDs[0]).toMatch(UUID_REGEXP);
    });

    it('should be able to get request batch (locked)', async () => {
      expect(await models.Request.rowCount()).toEqual(0);
      expect(await models.Batch.rowCount()).toEqual(0);

      var result = await app.post('/api/v1/scrape', {
        data: {
          requests: [
            { method: 'GET', url: 'http://example.com/' },
          ],
        },
      });

      expect(result.statusCode).toEqual(200);

      result = result.body;

      expect(await models.Request.rowCount()).toEqual(1);
      expect(await models.Batch.rowCount()).toEqual(1);

      var batchID   = result.batchID;
      var requestID = result.requestIDs[0];

      var batch = await models.Batch.first({ id: batchID });
      batch.update({ lockedAt: new Date(), completedAt: new Date() });

      result = await app.get(`/api/v1/request/${requestID}/batch`);

      expect(result.statusCode).toEqual(200);

      result = result.body;

      expect(result.batchID).toEqual(batchID);
      expect(result.status).toEqual('pending');
    });

    it('should be able to get request batch (error)', async () => {
      expect(await models.Request.rowCount()).toEqual(0);
      expect(await models.Batch.rowCount()).toEqual(0);

      var result = await app.post('/api/v1/scrape', {
        data: {
          requests: [
            { method: 'GET', url: 'http://example.com/' },
          ],
        },
      });

      expect(result.statusCode).toEqual(200);

      result = result.body;

      expect(await models.Request.rowCount()).toEqual(1);
      expect(await models.Batch.rowCount()).toEqual(1);

      var batchID   = result.batchID;
      var requestID = result.requestIDs[0];

      var batch = await models.Batch.first({ id: batchID });
      batch.update({ failedAt: new Date(), errorMessage: 'Some error' });

      result = await app.get(`/api/v1/request/${requestID}/batch`);

      expect(result.statusCode).toEqual(200);

      result = result.body;

      expect(result.batchID).toEqual(batchID);
      expect(result.status).toEqual('error');
      expect(result.errorMessage).toEqual('Some error');
    });

    it('should be able to get request batch (success)', async () => {
      expect(await models.Request.rowCount()).toEqual(0);
      expect(await models.Batch.rowCount()).toEqual(0);

      var result = await app.post('/api/v1/scrape', {
        data: {
          requests: [
            { method: 'GET', url: 'http://example.com/' },
          ],
        },
      });

      expect(result.statusCode).toEqual(200);

      result = result.body;

      expect(await models.Request.rowCount()).toEqual(1);
      expect(await models.Batch.rowCount()).toEqual(1);

      var batchID   = result.batchID;
      var requestID = result.requestIDs[0];

      var batch = await models.Batch.first({ id: batchID });
      batch.update({ completedAt: new Date() });

      result = await app.get(`/api/v1/request/${requestID}/batch`);

      expect(result.statusCode).toEqual(200);

      result = result.body;

      expect(result.batchID).toEqual(batchID);
      expect(result.status).toEqual('success');
    });
  });

  // -------------------- fetch content -------------------- //

  describe('fetch content', () => {
    it('should be able to fetch request content', async () => {
      expect(await models.Request.rowCount()).toEqual(0);
      expect(await models.Batch.rowCount()).toEqual(0);

      var result = await app.post('/api/v1/scrape', {
        data: {
          requests: [
            { method: 'GET', url: 'http://example.com/' },
          ],
        },
      });

      expect(result.statusCode).toEqual(200);

      result = result.body;

      expect(await models.Request.rowCount()).toEqual(1);
      expect(await models.Batch.rowCount()).toEqual(1);

      var requestID = result.requestIDs[0];

      var request = await models.Request.first({ id: requestID });
      await request.update({ completedAt: new Date() });

      var requestInfo = await request.getRequestInfo();

      await models.Cache.bulkCreate([ { requestInfo: requestInfo.id, rawContent: 'Test Cache Results' } ]);

      result = await app.get(`/api/v1/request/${requestID}/content`);

      expect(result.statusCode).toEqual(200);

      result = result.body;

      expect(result.requestID).toEqual(requestID);
      expect(result.content).toEqual('Test Cache Results');
      expect(result.updatedAt).not.toBe(null);
    });
  });
});
