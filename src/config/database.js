const { ZVecCreateAndOpen, ZVecOpen, ZVecCollectionSchema, ZVecDataType } = require("@zvec/zvec");
const fs = require("fs");
const path = require("path");

class DatabaseService {
  constructor() {
    this.collections = new Map();
    this.dataPath = "./zvec_data";
  }

  async init() {
    const collection = await this.createCollection("documents", {
      vectors: {
        name: "embedding",
        dataType: ZVecDataType.VECTOR_FP32,
        dimension: 768
      },
      fields: [
        { name: "title", dataType: ZVecDataType.STRING },
        { name: "category", dataType: ZVecDataType.STRING },
        { name: "year", dataType: ZVecDataType.INT32 }
      ]
    });

    this.collections.set("documents", collection);
    return collection;
  }

  async createCollection(name, schemaConfig) {
    const collectionPath = `${this.dataPath}/${name}`;
    const dirExists = fs.existsSync(collectionPath);

    const schema = new ZVecCollectionSchema({
      name: name,
      vectors: schemaConfig.vectors,
      fields: schemaConfig.fields
    });

    let collection;
    if (dirExists) {
      collection = ZVecOpen(collectionPath);
    } else {
      if (!fs.existsSync(this.dataPath)) fs.mkdirSync(this.dataPath, { recursive: true });
      collection = ZVecCreateAndOpen(collectionPath, schema);
    }

    return collection;
  }

  getCollection(name) {
    return this.collections.get(name);
  }

  async insertDocuments(collectionName, documents) {
    const collection = this.getCollection(collectionName);
    if (!collection) {
      throw new Error(`Collection ${collectionName} does not exist`);
    }

    const data = documents.map(doc => ({
      id: doc.id,
      vectors: { embedding: doc.embedding },
      fields: {
        title: doc.title,
        category: doc.category,
        year: doc.year
      }
    }));

    collection.insertSync(data);
    return documents;
  }

  async insertDocument(collectionName, document) {
    return this.insertDocuments(collectionName, [document]);
  }

  async query(collectionName, queryVector, topk = 10, filter = null) {
    const collection = this.getCollection(collectionName);
    if (!collection) {
      throw new Error(`Collection ${collectionName} does not exist`);
    }

    const query = { fieldName: "embedding", vector: queryVector, topk };
    if (filter) query.filter = filter;

    return collection.querySync(query);
  }

  async fetch(collectionName, id) {
    const collection = this.getCollection(collectionName);
    if (!collection) {
      throw new Error(`Collection ${collectionName} does not exist`);
    }

    return collection.fetchSync(id);
  }

  async deleteDocument(collectionName, id) {
    const collection = this.getCollection(collectionName);
    if (!collection) {
      throw new Error(`Collection ${collectionName} does not exist`);
    }

    collection.deleteSync([id]);
    return { success: true, deletedId: id };
  }

  async deleteDocuments(collectionName, ids) {
    const collection = this.getCollection(collectionName);
    if (!collection) {
      throw new Error(`Collection ${collectionName} does not exist`);
    }

    collection.deleteSync(ids);
    return { success: true, deletedCount: ids.length };
  }

  async deleteByFilter(collectionName, filter) {
    const collection = this.getCollection(collectionName);
    if (!collection) {
      throw new Error(`Collection ${collectionName} does not exist`);
    }

    collection.deleteByFilterSync(filter);
    return { success: true };
  }

  getStats(collectionName) {
    const collection = this.getCollection(collectionName);
    if (!collection) {
      throw new Error(`Collection ${collectionName} does not exist`);
    }

    return collection.stats;
  }
}

module.exports = new DatabaseService();