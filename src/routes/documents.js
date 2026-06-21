const express = require("express");
const router = express.Router();
const DatabaseService = require("../config/database");

const COLLECTION = "documents";
const VECTOR_DIMENSION = 768;

function validateCollection(collectionName) {
  return collectionName === COLLECTION ? null : `collectionName must be '${COLLECTION}'`;
}

function validateVector(vector, label = "embedding") {
  if (!Array.isArray(vector) || vector.length !== VECTOR_DIMENSION) {
    return `${label} must be an array of ${VECTOR_DIMENSION} numbers`;
  }
  if (!vector.every(Number.isFinite)) return `${label} must contain only finite numbers`;
  return null;
}

function validateDocument(document) {
  if (!document || typeof document !== "object" || Array.isArray(document)) return "Document is required";
  if (!document.id || typeof document.id !== "string") return "Document id is required";
  if (document.year !== undefined && !Number.isInteger(document.year)) return "Document year must be an integer";
  return validateVector(document.embedding);
}

function badRequest(res, message) {
  return res.status(400).json({ success: false, error: { message } });
}

/**
 * @openapi
 * /api/documents/insert:
 *   post:
 *     tags:
 *       - Documents
 *     summary: Insert multiple documents
 *     description: Bulk insert an array of documents with vector embeddings into a collection.
 *     operationId: insertDocuments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/InsertRequest"
 *           example:
 *             collectionName: documents
 *             documents:
 *               - id: doc_1
 *                 title: Introduction to Machine Learning
 *                 category: AI
 *                 year: 2020
 *                 embedding: [0.1, 0.2, 0.3, 0.4, 0.5]
 *               - id: doc_2
 *                 title: Deep Learning Fundamentals
 *                 category: AI
 *                 year: 2021
 *                 embedding: [0.2, 0.3, 0.4, 0.5, 0.6]
 *     responses:
 *       "200":
 *         description: Documents inserted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/InsertResponse"
 *             example:
 *               success: true
 *               message: Documents inserted successfully
 *               count: 2
 *       "400":
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *             example:
 *               success: false
 *               error:
 *                 message: "Documents array cannot be empty"
 */
router.post("/insert", async (req, res, next) => {
  try {
    const { collectionName, documents } = req.body || {};

    const collectionError = validateCollection(collectionName);
    if (collectionError) return badRequest(res, collectionError);
    if (!documents || !Array.isArray(documents)) {
      return res.status(400).json({ success: false, error: { message: "Documents array is required" } });
    }
    if (documents.length === 0) {
      return res.status(400).json({ success: false, error: { message: "Documents array cannot be empty" } });
    }
    for (const document of documents) {
      const validationError = validateDocument(document);
      if (validationError) return badRequest(res, validationError);
    }

    const result = await DatabaseService.insertDocuments(collectionName, documents);

    res.json({ success: true, message: "Documents inserted successfully", count: result.length });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/documents/insert-one:
 *   post:
 *     tags:
 *       - Documents
 *     summary: Insert a single document
 *     description: Insert one document with a vector embedding into a collection.
 *     operationId: insertOneDocument
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/InsertOneRequest"
 *           example:
 *             collectionName: documents
 *             document:
 *               id: doc_1
 *               title: Introduction to Machine Learning
 *               category: AI
 *               year: 2020
 *               embedding: [0.1, 0.2, 0.3, 0.4, 0.5]
 *     responses:
 *       "200":
 *         description: Document inserted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/InsertOneResponse"
 *             example:
 *               success: true
 *               message: Document inserted successfully
 *               data:
 *                 id: doc_1
 *                 title: Introduction to Machine Learning
 *                 category: AI
 *                 year: 2020
 *                 embedding: [0.1, 0.2, 0.3, 0.4, 0.5]
 *       "400":
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *             example:
 *               success: false
 *               error:
 *                 message: "Document is required"
 */
router.post("/insert-one", async (req, res, next) => {
  try {
    const { collectionName, document } = req.body || {};

    const collectionError = validateCollection(collectionName);
    if (collectionError) return badRequest(res, collectionError);
    const validationError = validateDocument(document);
    if (validationError) return badRequest(res, validationError);

    await DatabaseService.insertDocument(collectionName, document);

    res.json({ success: true, message: "Document inserted successfully", data: document });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/documents/query:
 *   post:
 *     tags:
 *       - Documents
 *     summary: Vector similarity search
 *     description: Search for documents most similar to a query vector using cosine similarity. Supports optional scalar field filtering.
 *     operationId: queryDocuments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/QueryRequest"
 *           example:
 *             collectionName: documents
 *             queryVector: [0.1, 0.2, 0.3, 0.4, 0.5]
 *             topk: 5
 *             filter: "year > 2020"
 *     responses:
 *       "200":
 *         description: Query executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/QueryResponse"
 *             example:
 *               success: true
 *               message: Query executed successfully
 *               count: 3
 *               results:
 *                 - id: doc_2
 *                   score: 0.95
 *                   vectors: {}
 *                   fields:
 *                     title: Deep Learning Fundamentals
 *                     category: AI
 *                     year: 2021
 *                 - id: doc_1
 *                   score: 0.87
 *                   vectors: {}
 *                   fields:
 *                     title: Introduction to Machine Learning
 *                     category: AI
 *                     year: 2020
 *       "400":
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.post("/query", async (req, res, next) => {
  try {
    const { collectionName, queryVector, topk = 10, filter = null } = req.body || {};

    const collectionError = validateCollection(collectionName);
    if (collectionError) return badRequest(res, collectionError);
    const vectorError = validateVector(queryVector, "queryVector");
    if (vectorError) return badRequest(res, vectorError);
    if (!Number.isInteger(topk) || topk < 1 || topk > 100) return badRequest(res, "topk must be an integer from 1 to 100");
    if (filter !== null && typeof filter !== "string") return badRequest(res, "filter must be a string");

    const results = await DatabaseService.query(collectionName, queryVector, topk, filter);

    res.json({ success: true, message: "Query executed successfully", count: results.length, results });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/documents/fetch/{id}:
 *   get:
 *     tags:
 *       - Documents
 *     summary: Fetch a document by ID
 *     description: Retrieve a single document from a collection by its unique ID.
 *     operationId: fetchDocument
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID to fetch
 *         example: doc_1
 *       - in: query
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the collection
 *         example: documents
 *     responses:
 *       "200":
 *         description: Document fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/FetchResponse"
 *             example:
 *               success: true
 *               data:
 *                 doc_1:
 *                   id: doc_1
 *                   score: 0
 *                   vectors: {}
 *                   fields:
 *                     title: Introduction to Machine Learning
 *                     category: AI
 *                     year: 2020
 *       "400":
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       "500":
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.get("/fetch/:id", async (req, res, next) => {
  try {
    const { collectionName } = req.query;
    const { id } = req.params;

    const collectionError = validateCollection(collectionName);
    if (collectionError) return badRequest(res, collectionError);

    const result = await DatabaseService.fetch(collectionName, id);

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/documents/{id}:
 *   delete:
 *     tags:
 *       - Documents
 *     summary: Delete a document by ID
 *     description: Remove a single document from a collection by its unique ID.
 *     operationId: deleteDocument
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID to delete
 *         example: doc_1
 *       - in: query
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the collection
 *         example: documents
 *     responses:
 *       "200":
 *         description: Document deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/DeleteResponse"
 *             example:
 *               success: true
 *               message: Document deleted successfully
 *               data:
 *                 success: true
 *                 deletedId: doc_1
 *       "400":
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.delete("/:id", async (req, res, next) => {
  try {
    if (req.params.id === "batch" || req.params.id === "filter") return next();
    const { collectionName } = req.query;
    const { id } = req.params;

    const collectionError = validateCollection(collectionName);
    if (collectionError) return badRequest(res, collectionError);

    const result = await DatabaseService.deleteDocument(collectionName, id);

    res.json({ success: true, message: "Document deleted successfully", data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/documents/batch:
 *   delete:
 *     tags:
 *       - Documents
 *     summary: Delete multiple documents by IDs
 *     description: Bulk delete documents from a collection by an array of IDs.
 *     operationId: batchDeleteDocuments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/BatchDeleteRequest"
 *           example:
 *             collectionName: documents
 *             ids: ["doc_1", "doc_2"]
 *     responses:
 *       "200":
 *         description: Documents deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/BatchDeleteResponse"
 *             example:
 *               success: true
 *               message: Documents deleted successfully
 *               data:
 *                 success: true
 *                 deletedCount: 2
 *       "400":
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.delete("/batch", async (req, res, next) => {
  try {
    const { collectionName, ids } = req.body || {};

    const collectionError = validateCollection(collectionName);
    if (collectionError) return badRequest(res, collectionError);
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ success: false, error: { message: "IDs array is required" } });
    }
    if (ids.length === 0 || !ids.every((id) => typeof id === "string" && id)) {
      return badRequest(res, "IDs array must contain at least one non-empty string");
    }

    const result = await DatabaseService.deleteDocuments(collectionName, ids);

    res.json({ success: true, message: "Documents deleted successfully", data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/documents/filter:
 *   delete:
 *     tags:
 *       - Documents
 *     summary: Delete documents by filter condition
 *     description: Delete all documents matching a filter expression (e.g. "year < 2020").
 *     operationId: filterDeleteDocuments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/FilterDeleteRequest"
 *           example:
 *             collectionName: documents
 *             filter: "year < 2020"
 *     responses:
 *       "200":
 *         description: Documents deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/FilterDeleteResponse"
 *             example:
 *               success: true
 *               message: Documents deleted successfully by filter
 *               data:
 *                 success: true
 *       "400":
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.delete("/filter", async (req, res, next) => {
  try {
    const { collectionName, filter } = req.body || {};

    const collectionError = validateCollection(collectionName);
    if (collectionError) return badRequest(res, collectionError);
    if (!filter) {
      return res.status(400).json({ success: false, error: { message: "Filter condition is required" } });
    }

    const result = await DatabaseService.deleteByFilter(collectionName, filter);

    res.json({ success: true, message: "Documents deleted successfully by filter", data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/documents/stats:
 *   get:
 *     tags:
 *       - Documents
 *     summary: Get collection statistics
 *     description: Retrieve statistics about a collection including document count and index completeness.
 *     operationId: getCollectionStats
 *     parameters:
 *       - in: query
 *         name: collectionName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the collection
 *         example: documents
 *     responses:
 *       "200":
 *         description: Collection statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/StatsResponse"
 *             example:
 *               success: true
 *               data:
 *                 docCount: 12
 *                 indexCompleteness:
 *                   embedding: 1
 *       "400":
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.get("/stats", async (req, res, next) => {
  try {
    const { collectionName } = req.query;

    const collectionError = validateCollection(collectionName);
    if (collectionError) return badRequest(res, collectionError);

    const stats = await DatabaseService.getStats(collectionName);

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
