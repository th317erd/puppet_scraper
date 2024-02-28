const Nife            = require('nife');
const { defineModel } = require('mythix');
const { ModelBase }   = require('./model-base');

module.exports = defineModel('RequestInfo', ({ Parent, Type, Sequelize, connection }) => {
  const Ops = Sequelize.Op;

  var queryFieldNameCache;

  return class RequestInfo extends Parent {
    static pluralName = 'RequestInfo';

    static fields = {
      id: {
        type:         Type.UUID,
        defaultValue: Type.UUIDV4,
        primaryKey:   true,
      },
      method: {
        type:         Type.STRING(8),
        defaultValue: 'GET',
        allowNull:    false,
        index:        true,
      },
      url: {
        type:         Type.STRING(2100),
        allowNull:    false,
        index:        true,
      },
      scheme: {
        type:         Type.STRING(10),
        allowNull:    false,
        index:        true,
      },
      host: {
        type:         Type.STRING(512),
        allowNull:    false,
        index:        true,
      },
      port: {
        type:         Type.INTEGER,
        allowNull:    false,
        index:        true,
      },
      path: {
        type:         Type.STRING(1024),
        allowNull:    false,
        index:        true,
      },
      query: {
        type:         Type.STRING(1024),
        allowNull:    true,
        index:        true,
      },
    };

    static getQueryFields() {
      if (queryFieldNameCache)
        return queryFieldNameCache;

      queryFieldNameCache = Nife.subtractFromArray(Object.keys(RequestInfo.getAttributes()), [ 'id', 'createdAt', 'updatedAt', 'sortOrder' ]);

      return queryFieldNameCache;
    }

    static buildRequestInfosQuery(_requestInfos) {
      var fieldNames    = RequestInfo.getQueryFields();
      var requestInfos  = Nife.toArray(_requestInfos);

      var query = requestInfos.map((requestInfo) => {
        var thisQuery = {};

        for (var i = 0, il = fieldNames.length; i < il; i++) {
          var fieldName = fieldNames[i];
          thisQuery[fieldName] = (requestInfo[fieldName] || null);
        }

        return RequestInfo.where(thisQuery);
      });

      return {
        [Ops.or]: query,
      };
    }

    static async getOrCreateMultipleRequestInfos(_requestInfos) {
      var requestInfos  = Nife.toArray(_requestInfos);
      var query         = RequestInfo.buildRequestInfosQuery(requestInfos);

      // See how many of these we can find in the DB
      var requestInfoModels = await RequestInfo.all(query);

      // If the DB returned all models, then just return result
      if (requestInfoModels.length >= requestInfos.length)
        return requestInfoModels;

      // Find and create any remaining requestInfos not found in the DB
      var fieldNames  = RequestInfo.getQueryFields();
      var remaining   = requestInfos.filter((requestInfo) => {
        if (requestInfoModels.findIndex((requestInfoModel) => !Nife.propsDiffer(requestInfo, requestInfoModel, fieldNames)) >= 0)
          return false;

        return true;
      });

      // Create remaining requestInfos in DB
      return await connection.transaction(async (transaction) => {
        requestInfoModels = requestInfoModels.concat(
          await RequestInfo.bulkCreate(remaining, { transaction }),
        );

        return requestInfoModels;
      });
    }
  };
}, ModelBase);
