const Nife            = require('nife');
const { defineModel } = require('mythix');
const { ModelBase }   = require('./model-base');

module.exports = defineModel('Request', ({ Parent, Type, Relation, Sequelize }) => {
  return class Request extends Parent {
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
      failCount: {
        type:         Type.INTEGER,
        defaultValue: 0,
        allowNull:    true,
        index:        true,
      },
      nextRetryAtMS: {
        type:         Type.BIGINT,
        defaultValue: 0,
        allowNull:    true,
        index:        true,
      },
    };

    static relations = [
      Relation.belongsTo('User',        { allowNull: false, onDelete: 'CASCADE',  name: 'user' }),
      Relation.belongsTo('RequestInfo', { allowNull: false, onDelete: 'RESTRICT', name: 'requestInfo' }),
      Relation.belongsTo('Batch',       { allowNull: true,  onDelete: 'SET NULL', onUpdate: 'NO ACTION', name: 'batch' }),
    ];

    // Batch here isn't required, but is used only as a "hint"
    static async getRequestIDsFromRequestInfos(currentUser, requestInfos, batch) {
      var query = {
        user:         currentUser.id,
        requestInfos: Nife.uniq(Nife.pluck('id', requestInfos)),
      };

      if (batch)
        query.batch = batch.id;

      var requests = await Request.all(query, { attributes: [ 'id' ] });

      return Nife.pluck('id', requests);
    }

    static async getRequestIDsFromBatches(currentUser, batches) {
      var batchIDs = Nife.pluck('id', Nife.toArray(batches));

      var query = {
        user:   currentUser.id,
        batch:  batchIDs,
      };

      var requests = await Request.all(query, { attributes: [ 'id', 'batch' ] });

      // Map { 'batchID' -> [ requestIDs ] }
      return requests.reduce((map, row) => {
        var requestIDs = map[row.batch];
        if (!requestIDs)
          requestIDs = map[row.batch] = [];

        requestIDs.push(row.id);

        return map;
      }, {});
    }
  };
}, ModelBase);
