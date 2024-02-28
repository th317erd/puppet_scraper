const Nife            = require('nife');
const { defineModel } = require('mythix');
const { ModelBase }   = require('./model-base');

module.exports = defineModel('Cache', ({ Parent, Type, Relation, Sequelize }) => {
  const Ops = Sequelize.Op;

  return class Cache extends Parent {
    static fields = {
      id: {
        type:         Type.UUID,
        defaultValue: Type.UUIDV4,
        primaryKey:   true,
      },
      rawContent: {
        type:         Type.TEXT,
        allowNull:    false,
      },
    };

    static relations = [
      Relation.belongsTo('RequestInfo', { allowNull: false, onDelete: 'RESTRICT', name: 'requestInfo' }),
    ];

    static async getCacheModelsFromRequestInfos(_requestInfos) {
      var requestInfos    = Nife.toArray(_requestInfos);
      var requestInfoIDs  = Nife.pluck('id', requestInfos);

      return await Cache.all({ requestInfo: requestInfoIDs }, {
        order: [[ 'updatedAt', 'DESC' ]],
        col: 'requestInfo',
        distinct: true,
      });
    }
  };
}, ModelBase);
