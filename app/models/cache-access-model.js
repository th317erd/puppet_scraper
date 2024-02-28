const Nife            = require('nife');
const { defineModel } = require('mythix');
const { ModelBase }   = require('./model-base');

module.exports = defineModel('CacheAccess', ({ Parent, Type, Relation, connection }) => {
  return class CacheAccess extends Parent {
    static pluralName = 'CacheAccess';

    static fields = {
      id: {
        type:         Type.UUID,
        defaultValue: Type.UUIDV4,
        primaryKey:   true,
      },
    };

    static relations = [
      Relation.belongsTo('User',   { allowNull: false, onDelete: 'CASCADE', name: 'user' }),
      Relation.belongsTo('Cache',  { allowNull: false, onDelete: 'CASCADE', name: 'cache' }),
    ];

    static async createCacheAccessRecords(currentUser, caches) {
      if (Nife.isEmpty(caches))
        return;

      // Create cache access records
      await connection.transaction(async (transaction) => {
        await CacheAccess.bulkCreate(caches.map((cache) => {
          return { user: currentUser.id, cache: cache.id };
        }), { transaction });
      });
    }
  };
}, ModelBase);
