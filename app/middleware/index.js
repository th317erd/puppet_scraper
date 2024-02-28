const AuthMiddleware = require('./auth-middleware');

module.exports = Object.assign(module.exports,
  AuthMiddleware,
);
