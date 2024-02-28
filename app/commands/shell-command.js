const { defineCommand } = require('mythix');

module.exports = defineCommand('shell', ({ Parent }) => {
  return class ShellCommand extends Parent {
    onStart(interactiveShell) {
      var context = interactiveShell.context;

      context.createRequest = this.createRequest.bind(this, context);
      context.createBatchRequest = this.createBatchRequest.bind(this, context);

      var application = this.getApplication();

      context.HTTP.setDefaultURL('http://localhost:8001');
      context.HTTP.setDefaultHeader('Authorization', `Token ${application.getConfigValue('scraperAPIKey')}`);
      context.HTTP.setDefaultHeader('Content-Type', `application/json`);
    }

    async createRequest(context, url, method = 'GET') {
      return await context.HTTP.post('/api/v1/scrape', { data: { method, url }, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }

    async createBatchRequest(context, urls, method = 'GET') {
      return await context.HTTP.post('/api/v1/scrape/batch', {
        data: {
          requests: urls.map((url) => ({ method, url })),
        },
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }
  };
}, 'shell');
