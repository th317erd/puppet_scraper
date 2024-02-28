const Path                = require('path');
const Mythix              = require('mythix');
const getRoutes           = require('./routes');
const { authMiddleware }  = require('./middleware');

class Application extends Mythix.Application {
  static APP_NAME = 'puppet_scraper';

  constructor(_opts) {
    var opts = Object.assign({
      rootPath: Path.resolve(__dirname),
      httpServer: {
        middleware: [
          authMiddleware,
        ],
      },
    }, _opts || {});

    super(opts);
  }

  getRoutes(...args) {
    return getRoutes.apply(this, args);
  }
}

module.exports = {
  Application,
};
