const { defineModel }               = require('mythix');
const { getRandomUserAgentString }  = require('../utils/utils');
const { ModelBase }                 = require('./model-base');

module.exports = defineModel('DomainMeta', ({ Parent, Type }) => {
  return class DomainMeta extends Parent {
    static fields = {
      id: {
        type:         Type.UUID,
        defaultValue: Type.UUIDV4,
        primaryKey:   true,
      },
      domain: {
        type:         Type.STRING(1024),
        allowNull:    false,
        index:        true,
      },
      userAgent: {
        type:         Type.STRING(1024),
        defaultValue: getRandomUserAgentString,
        allowNull:    true,
        index:        true,
      },
      lastRequestAtMS: {
        type:         Type.BIGINT,
        allowNull:    true,
        index:        true,
      },
      rateLimitMS: {
        type:         Type.INTEGER,
        allowNull:    true,
      },
    };
  };
}, ModelBase);
