const { defineModel } = require('mythix');
const { ModelBase }   = require('./model-base');

module.exports = defineModel('Batch', ({ Parent, Type, Relation }) => {
  return class Batch extends Parent {
    static fields = {
      id: {
        type:         Type.UUID,
        defaultValue: Type.UUIDV4,
        primaryKey:   true,
      },
      status: {
        type:         Type.STRING(16),
        defaultValue: 'initiated',
        allowNull:    false,
        index:        true,
      },
      doneAcceptingRequestsAt: {
        type:         Type.DATE,
        allowNull:    true,
        index:        true,
      },
      markedReceivedAt: {
        type:         Type.DATE,
        allowNull:    true,
        index:        true,
      },
      lockedBy: {
        type:         Type.STRING(18),
        allowNull:    true,
        index:        true,
      },
      lockedAt: {
        type:         Type.DATE,
        allowNull:    true,
        index:        true,
      },
      completedAt: {
        type:         Type.DATE,
        allowNull:    true,
        index:        true,
      },
      failedAt: {
        type:         Type.DATE,
        allowNull:    true,
        index:        true,
      },
      errorMessage: {
        type:         Type.STRING(256),
        allowNull:    true,
      },
      webhookSuccess: {
        type:         Type.BOOLEAN,
        defaultValue: false,
        index:        true,
      },
      webhookSuccessAt: {
        type:         Type.DATE,
        allowNull:    true,
        index:        true,
      },
      webhookFailedAt: {
        type:         Type.DATE,
        allowNull:    true,
        index:        true,
      },
      webhookErrorMessage: {
        type:         Type.STRING(256),
        allowNull:    true,
      },
      webhookRetryCount: {
        type:         Type.INTEGER,
        defaultValue: 0,
        index:        true,
      },
      webhookNextRetryAtMS: {
        type:         Type.BIGINT,
        defaultValue: 0,
        allowNull:    true,
        index:        true,
      },
    };

    static relations = [
      Relation.belongsTo('User',  { allowNull: false, onDelete: 'CASCADE',  name: 'user' }),
      Relation.hasMany('Request', { allowNull: true, onDelete: 'RESTRICT', name: 'requests' }),
    ];
  };
}, ModelBase);
