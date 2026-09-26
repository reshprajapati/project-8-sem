const { v4: uuidv4 } = require('uuid');
const BaseModel = require('./BaseModel');

class DesignModel extends BaseModel {
  constructor() {
    super('designs');
  }

  async create(designData) {
    const design = {
      _id: uuidv4(),
      ...designData
    };

    return super.create(design);
  }

  async find(query = {}) {
    const results = await super.find();

    if (Object.keys(query).length === 0) {
      return results;
    }

    return results.filter(design => {
      return Object.keys(query).every(key => {
        if (key === 'isPortfolio') {
          return design[key] === (query[key] === true || query[key] === 'true');
        }
        return design[key] === query[key];
      });
    });
  }
}

module.exports = new DesignModel();
