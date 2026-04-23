const { v4: uuidv4 } = require('uuid');
const { db } = require('./init');

class DesignModel {
  static async create(designData) {
    const design = {
      _id: uuidv4(),
      ...designData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    db.designs.data.designs.push(design);
    await db.designs.write();
    return design;
  }

  static async find(query = {}) {
    let results = db.designs.data.designs;
    
    if (Object.keys(query).length > 0) {
      results = results.filter(design => {
        return Object.keys(query).every(key => {
          if (key === 'isPortfolio') {
            return design[key] === (query[key] === true || query[key] === 'true');
          }
          return design[key] === query[key];
        });
      });
    }

    return results;
  }

  static async findById(id) {
    return db.designs.data.designs.find(design => design._id === id);
  }

  static async findByIdAndUpdate(id, updates) {
    const index = db.designs.data.designs.findIndex(design => design._id === id);
    if (index === -1) return null;
    const design = { 
      ...db.designs.data.designs[index], 
      ...updates, 
      updatedAt: new Date() 
    };
    db.designs.data.designs[index] = design;
    await db.designs.write();
    return design;
  }

  static async findByIdAndDelete(id) {
    const index = db.designs.data.designs.findIndex(design => design._id === id);
    if (index === -1) return null;
    const design = db.designs.data.designs[index];
    db.designs.data.designs.splice(index, 1);
    await db.designs.write();
    return design;
  }

  static populate(path) {
    return this;
  }

  static sort(options) {
    return this;
  }
}

module.exports = DesignModel;
