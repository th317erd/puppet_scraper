const { Application } = require('./application');

(async function() {
  const app = new Application({ exitOnShutdown: 0 });
  await app.start();
})();
