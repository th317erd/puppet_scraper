const Nife      = require('nife');
const { Model } = require('mythix');

class ModelBase extends Model {
  static onModelClassCreate(Model, { Type, connection }) {
    Model.fields['sortOrder'] = {
      type:           Type.BIGINT,
      autoIncrement:  true,
      allowNull:      false,
      index:          true,
    };

    return Model;
  }

  static getDefaultOrderBy(Model) {
    return [ 'sortOrder' ];
  }
}

module.exports = {
  ModelBase,
};
