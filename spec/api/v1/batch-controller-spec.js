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
        { method: 'post', url: '/api/v1/scrape/derp/add' },
        { method: 'post', url: '/api/v1/scrape/derp/finalize' },
        { method: 'get',  url: '/api/v1/scrape/derp' },
        { method: 'post', url: '/api/v1/scrape/mark' },
        { method: 'get',  url: '/api/v1/scrape/unreceived' },
        { method: 'get',  url: '/api/v1/scrape/pending' },
        { method: 'post', url: '/api/v1/scrape' },
      ];

      for (var i = 0, il = urls.length; i < il; i++) {
        var { method, url } = urls[i];

        var result = await app[method]('/api/v1/scrape', { headers: { 'Authorization': null } });
        expect(result.statusCode).toEqual(401);
        expect(result.body).toEqual("Unauthorized");
      }
    });
  });

  describe('fail', () => {
    it('should fail on bad content-type', async () => {
      var result = await app.post('/api/v1/scrape', { headers: { 'Content-Type': 'text/plain' } });
      expect(result.statusCode).toEqual(400);
      expect(result.body).toEqual("Bad Request: Accepted Content-Types are [ 'application/json' ]");
    });

    it('should fail on bad request', async () => {
      var result = await app.post('/api/v1/scrape');
      expect(result.statusCode).toEqual(400);
      expect(result.body).toEqual('"requests" required');
    });

    it('should fail on bad request (add)', async () => {
      var result = await app.post('/api/v1/scrape/derp/add');
      expect(result.statusCode).toEqual(404);
      expect(result.body).toEqual('Not Found');
    });

    it('should fail on bad request (finalize)', async () => {
      var result = await app.post('/api/v1/scrape/derp/finalize');
      expect(result.statusCode).toEqual(404);
      expect(result.body).toEqual('Not Found');
    });

    it('should fail on bad request (mark)', async () => {
      var result = await app.post('/api/v1/scrape/mark');
      expect(result.statusCode).toEqual(400);
      expect(result.body).toEqual('"batchIDs" required');
    });
  });

  // -------------------- create -------------------- //

  describe('create', () => {
    it('should be able to create a batch request', async () => {
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

      expect(result.batchID).toMatch(UUID_REGEXP);
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
  });

  // -------------------- add -------------------- //

  describe('add', () => {
    it('should be able to add to a batch request', async () => {
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

      var batchID = result.batchID;

      expect(await models.Request.rowCount()).toEqual(1);
      expect(await models.Batch.rowCount()).toEqual(1);

      result = await app.post(`/api/v1/scrape/${batchID}/add`, {
        data: {
          requests: [
            { method: 'GET', url: 'http://www/derp.com/' },
          ],
        },
      });

      expect(result.statusCode).toEqual(200);

      result = result.body;

      batchID = result.batchID;

      expect(await models.Request.rowCount()).toEqual(2);
      expect(await models.Batch.rowCount()).toEqual(1);

      expect(batchID).toMatch(UUID_REGEXP);
      expect(result.status).toEqual('pending');
      expect(result.createdAt).not.toBe(null);
      expect(result.updatedAt).not.toBe(null);
      expect(result.updatedAt).not.toBe(null);
      expect(result.doneAcceptingRequestsAt).toBe(null);
      expect(result.markedReceivedAt).toBe(null);
      expect(result.completedAt).toBe(null);
      expect(result.failedAt).toBe(null);
      expect(result.requestIDs).toBeInstanceOf(Array);
      expect(result.requestIDs.length).toEqual(2);
      expect(result.requestIDs[0]).toMatch(UUID_REGEXP);
      expect(result.requestIDs[1]).toMatch(UUID_REGEXP);
    });
  });

  // -------------------- finalize -------------------- //

  describe('finalize', () => {
    it('should be able to add to finalize a batch request', async () => {
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

      var batchID = result.batchID;

      expect(await models.Request.rowCount()).toEqual(1);
      expect(await models.Batch.rowCount()).toEqual(1);


      result = await app.post(`/api/v1/scrape/${batchID}/finalize`);

      expect(result.statusCode).toEqual(200);

      result = result.body;

      batchID = result.batchID;

      expect(await models.Request.rowCount()).toEqual(1);
      expect(await models.Batch.rowCount()).toEqual(1);

      expect(batchID).toMatch(UUID_REGEXP);
      expect(result.status).toEqual('finalized');
      expect(result.createdAt).not.toBe(null);
      expect(result.updatedAt).not.toBe(null);
      expect(result.updatedAt).not.toBe(null);
      expect(result.doneAcceptingRequestsAt).not.toBe(null);
      expect(result.markedReceivedAt).toBe(null);
      expect(result.completedAt).toBe(null);
      expect(result.failedAt).toBe(null);
      expect(result.requestIDs).toBeInstanceOf(Array);
      expect(result.requestIDs.length).toEqual(1);
      expect(result.requestIDs[0]).toMatch(UUID_REGEXP);
    });
  });

  // -------------------- pending -------------------- //

  describe('pending', () => {
    it('should be able to get pending batch requests', async () => {
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

      result = await app.get('/api/v1/scrape/pending');

      expect(result.statusCode).toEqual(200);

      result = result.body;

      expect(result.total).toEqual(1);

      var batches = result.batches;
      expect(batches).toBeInstanceOf(Array);
      expect(batches.length).toEqual(1);

      var batch = batches[0];

      expect(batch.batchID).toMatch(UUID_REGEXP);
      expect(batch.status).toEqual('pending');
      expect(batch.createdAt).not.toBe(null);
      expect(batch.updatedAt).not.toBe(null);
      expect(batch.updatedAt).not.toBe(null);
      expect(batch.doneAcceptingRequestsAt).toBe(null);
      expect(batch.markedReceivedAt).toBe(null);
      expect(batch.completedAt).toBe(null);
      expect(batch.failedAt).toBe(null);
      expect(batch.requestIDs).toBeInstanceOf(Array);
      expect(batch.requestIDs.length).toEqual(1);
      expect(batch.requestIDs[0]).toMatch(UUID_REGEXP);
    });

    it('should be able to get pending batch requests (applying limit and offset)', async () => {
      expect(await models.Request.rowCount()).toEqual(0);
      expect(await models.Batch.rowCount()).toEqual(0);

      for (var i = 0; i < 10; i++) {
        var result = await app.post('/api/v1/scrape', {
          data: {
            requests: [
              { method: 'GET', url: `http://example.com/${i}` },
            ],
          },
        });

        expect(result.statusCode).toEqual(200);
      }

      expect(await models.Request.rowCount()).toEqual(10);
      expect(await models.Batch.rowCount()).toEqual(10);

      result = await app.get('/api/v1/scrape/pending?limit=3&offset=0');

      expect(result.statusCode).toEqual(200);

      result = result.body;

      expect(result.total).toEqual(10);

      var batches = result.batches;
      expect(batches).toBeInstanceOf(Array);
      expect(batches.length).toEqual(3);
    });
  });

  // -------------------- unreceived -------------------- //

  describe('unreceived', () => {
    it('should be able to get unreceived batch requests', async () => {
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

      var batch = await models.Batch.first();
      await batch.update({ completedAt: new Date() });

      result = await app.get('/api/v1/scrape/unreceived');

      expect(result.statusCode).toEqual(200);

      result = result.body;

      expect(result.total).toEqual(1);

      var batches = result.batches;
      expect(batches).toBeInstanceOf(Array);
      expect(batches.length).toEqual(1);

      var batch = batches[0];

      expect(batch.batchID).toMatch(UUID_REGEXP);
      expect(batch.status).toEqual('pending');
      expect(batch.createdAt).not.toBe(null);
      expect(batch.updatedAt).not.toBe(null);
      expect(batch.updatedAt).not.toBe(null);
      expect(batch.doneAcceptingRequestsAt).toBe(null);
      expect(batch.markedReceivedAt).toBe(null);
      expect(batch.completedAt).not.toBe(null);
      expect(batch.failedAt).toBe(null);
      expect(batch.requestIDs).toBeInstanceOf(Array);
      expect(batch.requestIDs.length).toEqual(1);
      expect(batch.requestIDs[0]).toMatch(UUID_REGEXP);
    });

    it('should be able to get unreceived batch requests (empty when all received)', async () => {
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

      var batch = await models.Batch.first();
      await batch.update({ completedAt: new Date(), markedReceivedAt: new Date() });

      result = await app.get('/api/v1/scrape/unreceived');

      expect(result.statusCode).toEqual(200);

      result = result.body;

      expect(result.total).toEqual(0);

      var batches = result.batches;
      expect(batches).toBeInstanceOf(Array);
      expect(batches.length).toEqual(0);
    });
  });

  // -------------------- mark -------------------- //

  describe('mark', () => {
    it('should be able to get mark batch requests', async () => {
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

      var batch = await models.Batch.first();
      expect(batch.markedReceivedAt).toBe(null);

      await batch.update({ completedAt: new Date() });

      var batchIDs = [ result.batchID ];

      result = await app.post('/api/v1/scrape/mark', { data: { batchIDs } });

      expect(result.statusCode).toEqual(200);

      result = result.body;

      expect(result.status).toEqual('received');

      expect(result.batchIDs).toBeInstanceOf(Array);
      expect(result.batchIDs.length).toEqual(1);
      expect(result.batchIDs[0]).toMatch(UUID_REGEXP);

      batch = await models.Batch.first();
      expect(batch.markedReceivedAt).not.toBe(null);
    });

    it('should be able to get unmark batch requests', async () => {
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

      var batch = await models.Batch.first();
      expect(batch.markedReceivedAt).toBe(null);

      await batch.update({ completedAt: new Date(), markedReceivedAt: new Date() });

      var batchIDs = [ result.batchID ];

      result = await app.post('/api/v1/scrape/mark', { data: { batchIDs, received: false } });

      expect(result.statusCode).toEqual(200);

      result = result.body;

      expect(result.status).toEqual('unreceived');

      expect(result.batchIDs).toBeInstanceOf(Array);
      expect(result.batchIDs.length).toEqual(1);
      expect(result.batchIDs[0]).toMatch(UUID_REGEXP);

      batch = await models.Batch.first();
      expect(batch.markedReceivedAt).toBe(null);
    });
  });

  // -------------------- fetch content -------------------- //

  describe('fetch content', () => {
    it('should be able to getch scraped content from batch requests', async () => {
      expect(await models.Request.rowCount()).toEqual(0);
      expect(await models.Batch.rowCount()).toEqual(0);

      var result = await app.post('/api/v1/scrape', {
        data: {
          requests: [
            { method: 'GET', url: 'http://example.com/1' },
            { method: 'GET', url: 'http://example.com/2' },
            { method: 'GET', url: 'http://example.com/3' },
            { method: 'GET', url: 'http://example.com/4' },
            { method: 'GET', url: 'http://example.com/5' },
            { method: 'GET', url: 'http://example.com/6' },
            { method: 'GET', url: 'http://example.com/7' },
            { method: 'GET', url: 'http://example.com/8' },
            { method: 'GET', url: 'http://example.com/9' },
          ],
        },
      });

      expect(result.statusCode).toEqual(200);

      result = result.body;

      expect(await models.Request.rowCount()).toEqual(9);
      expect(await models.Batch.rowCount()).toEqual(1);

      var batchID = result.batchID;

      await models.Batch.bulkUpdate({ completedAt: new Date(), doneAcceptingRequestsAt: new Date() });
      await models.Request.bulkUpdate({ completedAt: new Date() });

      var requests  = await models.Request.all();
      var caches    = [];

      for (var i = 0, il = requests.length; i < il; i++) {
        var request     = requests[i];

        if (!request.completedAt)
          throw new Error('Something bad happened!');

        var requestInfo = await request.getRequestInfo();

        caches.push({
          requestInfo:  requestInfo.id,
          rawContent:   requestInfo.url,
        });
      }

      await models.Cache.bulkCreate(caches);

      result = await app.get(`/api/v1/scrape/${batchID}`);

      expect(result.statusCode).toEqual(200);

      result = result.body;

      expect(result.total).toEqual(9);
      expect(result.content).toBeInstanceOf(Array);
      expect(result.content.length).toEqual(9);

      result.content = result.content.sort((a, b) => {
        var x = a.url;
        var y = b.url;

        if (x == y)
          return 0;

        return (x < y) ? -1 : 1;
      });

      for (var i = 0, il = result.content.length; i < il; i++) {
        var content = result.content[i];
        var url     = `http://example.com/${i + 1}`;

        expect(content.method).toEqual('GET');
        expect(content.url).toEqual(url);
        expect(content.content).toEqual(url);
        expect(content.updatedAt).not.toBe(null);
      }
    });

    it('should be able to getch scraped content from batch requests (with limit and offset)', async () => {
      expect(await models.Request.rowCount()).toEqual(0);
      expect(await models.Batch.rowCount()).toEqual(0);

      var result = await app.post('/api/v1/scrape', {
        data: {
          requests: [
            { method: 'GET', url: 'http://example.com/1' },
            { method: 'GET', url: 'http://example.com/2' },
            { method: 'GET', url: 'http://example.com/3' },
            { method: 'GET', url: 'http://example.com/4' },
            { method: 'GET', url: 'http://example.com/5' },
            { method: 'GET', url: 'http://example.com/6' },
            { method: 'GET', url: 'http://example.com/7' },
            { method: 'GET', url: 'http://example.com/8' },
            { method: 'GET', url: 'http://example.com/9' },
          ],
        },
      });

      expect(result.statusCode).toEqual(200);

      result = result.body;

      expect(await models.Request.rowCount()).toEqual(9);
      expect(await models.Batch.rowCount()).toEqual(1);

      var batchID = result.batchID;

      await models.Batch.bulkUpdate({ completedAt: new Date(), doneAcceptingRequestsAt: new Date() });
      await models.Request.bulkUpdate({ completedAt: new Date() });

      var requests  = await models.Request.all();
      var caches    = [];

      for (var i = 0, il = requests.length; i < il; i++) {
        var request     = requests[i];

        if (!request.completedAt)
          throw new Error('Something bad happened!');

        var requestInfo = await request.getRequestInfo();

        caches.push({
          requestInfo:  requestInfo.id,
          rawContent:   requestInfo.url,
        });
      }

      await models.Cache.bulkCreate(caches);

      result = await app.get(`/api/v1/scrape/${batchID}?limit=3&offset=3`);

      expect(result.statusCode).toEqual(200);

      result = result.body;

      expect(result.total).toEqual(9);
      expect(result.content).toBeInstanceOf(Array);
      expect(result.content.length).toEqual(3);
    });

    it('should be able to getch scraped content from batch requests (not yet finished)', async () => {
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

      var batch = await models.Batch.first();
      expect(batch.markedReceivedAt).toBe(null);

      result = await app.get(`/api/v1/scrape/${batch.id}`);

      expect(result.statusCode).toEqual(204);
    });
  });
});
