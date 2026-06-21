const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DatabaseService = require("../config/database");
const { embedText, embedBatch } = require("./embeddingService");
const { chunkPdf } = require("./pdfService");

const COLLECTION = "pdf_chunks";
const DATA_DIR = path.resolve(process.env.ZVEC_DATA_PATH || path.join(__dirname, "../../zvec_data"));
const REGISTRY_PATH = path.join(DATA_DIR, "pdf_registry.json");

// Minimum similarity score for a chunk to be considered a relevant answer.
// Cosine similarity on normalized embeddings; tunable via env.
const configuredThreshold = Number.parseFloat(process.env.RAG_SCORE_THRESHOLD || "0.2");
const SCORE_THRESHOLD = Number.isFinite(configuredThreshold) ? configuredThreshold : 0.2;

/** Load the persisted document registry, or an empty list if none exists. */
function loadRegistry() {
  try {
    if (fs.existsSync(REGISTRY_PATH)) {
      const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
      return Array.isArray(registry) ? registry : [];
    }
  } catch (err) {
    console.error("Failed to read PDF registry:", err.message);
  }
  return [];
}

/** Persist the document registry to disk. */
function saveRegistry(registry) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const temporaryPath = `${REGISTRY_PATH}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify(registry, null, 2));
  fs.renameSync(temporaryPath, REGISTRY_PATH);
}

/**
 * Ingest a PDF: parse → chunk → embed → store in the vector DB, and record it
 * in the registry.
 * @param {Buffer} buffer Raw PDF bytes
 * @param {string} filename Original file name
 * @returns {Promise<object>} Ingestion summary
 */
async function ingestPdf(buffer, filename) {
  const { chunks, numPages } = await chunkPdf(buffer);

  if (chunks.length === 0) {
    const err = new Error("No extractable text found in the PDF. It may be scanned or image-only.");
    err.statusCode = 422;
    throw err;
  }

  // Zvec IDs must be alphanumeric/underscore, so strip dashes from the UUID.
  const safeFilename = path.basename(filename).replace(/[\u0000-\u001f]/g, "").slice(0, 255) || "document.pdf";
  const docId = crypto.randomUUID().replace(/-/g, "");
  const embeddings = await embedBatch(chunks.map((c) => c.text));

  const records = chunks.map((chunk, index) => ({
    id: `${docId}_${index}`,
    embedding: embeddings[index],
    text: chunk.text,
    source: safeFilename,
    docId,
    page: chunk.page,
    chunkIndex: index
  }));

  await DatabaseService.insertChunks(COLLECTION, records);
  DatabaseService.optimize(COLLECTION);

  const entry = {
    docId,
    filename: safeFilename,
    sizeBytes: buffer.length,
    numPages,
    chunkCount: chunks.length,
    uploadedAt: new Date().toISOString()
  };

  const registry = loadRegistry();
  registry.push(entry);
  saveRegistry(registry);

  return entry;
}

/**
 * Answer a question by retrieving the most relevant PDF chunks.
 * @param {string} question
 * @param {object} [opts]
 * @param {string} [opts.docId] Restrict search to a single document
 * @param {number} [opts.topk] Number of chunks to retrieve
 * @returns {Promise<object>}
 */
async function askQuestion(question, opts = {}) {
  const topk = Math.min(Math.max(parseInt(opts.topk, 10) || 4, 1), 20);
  const registry = loadRegistry();
  if (opts.docId && !/^[a-f0-9]{32}$/.test(opts.docId)) {
    const err = new Error("Invalid document id");
    err.statusCode = 400;
    throw err;
  }
  if (opts.docId && !registry.some((document) => document.docId === opts.docId)) {
    const err = new Error("Document not found");
    err.statusCode = 404;
    throw err;
  }

  if (registry.length === 0) {
    return {
      found: false,
      question,
      message: "No PDFs have been uploaded yet. Upload a PDF before asking a question.",
      matches: []
    };
  }

  const queryVector = await embedText(question);

  const filter = opts.docId ? `docId == "${opts.docId}"` : null;
  const results = await DatabaseService.query(COLLECTION, queryVector, topk, filter);

  const matches = (results || []).map((r) => ({
    score: r.score,
    text: r.fields?.text ?? "",
    source: r.fields?.source ?? "",
    page: r.fields?.page ?? null,
    docId: r.fields?.docId ?? null
  }));

  const relevant = matches.filter((m) => m.score >= SCORE_THRESHOLD);

  if (relevant.length === 0) {
    return {
      found: false,
      question,
      message:
        "No relevant information for your question was found in the uploaded PDF(s). Try rephrasing, or upload a document that contains this information.",
      matches: []
    };
  }

  return {
    found: true,
    question,
    answer: relevant.map((m) => m.text).join("\n\n---\n\n"),
    matches: relevant
  };
}

/** List all ingested PDFs. */
function listDocuments() {
  return loadRegistry();
}

/**
 * Delete an ingested PDF and all of its chunks from the vector DB.
 * @param {string} docId
 * @returns {Promise<object>}
 */
async function deleteDocument(docId) {
  if (!/^[a-f0-9]{32}$/.test(docId)) {
    const err = new Error("Invalid document id");
    err.statusCode = 400;
    throw err;
  }
  const registry = loadRegistry();
  const entry = registry.find((d) => d.docId === docId);
  if (!entry) {
    const err = new Error("Document not found");
    err.statusCode = 404;
    throw err;
  }

  await DatabaseService.deleteByFilter(COLLECTION, `docId == "${docId}"`);
  saveRegistry(registry.filter((d) => d.docId !== docId));

  return { docId, filename: entry.filename };
}

module.exports = { ingestPdf, askQuestion, listDocuments, deleteDocument, SCORE_THRESHOLD };
