const { createTestApplication } = require('mythix');
const { Application }           = require('../../app/application');
const TestApplication = createTestApplication(Application);

async function newTestApplication() {
  var app = new TestApplication();
  await app.start();

  app.setConfig({
    salt: ('' + Math.random()),
  });

  const { User } = app.getModels();
  var token = 'a1d03fec-79e4-4282-8e40-817b0c5c8bfd';

  var user = await User.newUser({
    firstName:      "Test",
    lastName:       "User",
    email:          "user@example.com",
    webhookURL:     "http://localhost:8000/api/v1/scraper_webhook",
    webhookSecret:  'f00227b2c52d9ed8cdcf0d08371342da299f0701fe94898a54a04ae34cb0deda',
    token,
  });

  app.setDefaultHeaders({
    'Content-Type':   'application/json',
    'Authorization':  `Token ${token}`,
  });

  Object.defineProperties(app, {
    'currentUser': {
      writable:     true,
      enumberable:  false,
      configurable: true,
      value:        user,
    },
  });

  return app;
}

const UUID_REGEXP = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

module.exports = {
  TestApplication,
  newTestApplication,
  UUID_REGEXP,
};
