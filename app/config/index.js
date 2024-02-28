const database    = require('./db-config');
const sensitive   = require('./sensitive');
const { Logger }  = require('mythix');

module.exports = Object.assign({
  environment:  process.env.NODE_ENV || 'development',
  database,
  logger: {
    level: Logger.INFO,
  },
}, sensitive);
