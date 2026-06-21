const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DatabaseService = require("../config/database");
const { embedText, embedBatch } = require("./embeddingService");
const { chunkPdf } = require("./pdfService");
const { preprocessQuery } = require("./queryPreprocessor");

const COLLECTION = "pdf_chunks";
const DATA_DIR = path.resolve(process.env.ZVEC_DATA_PATH || path.join(__dirname, "../../zvec_data"));
const REGISTRY_PATH = path.join(DATA_DIR, "pdf_registry.json");

// Minimum similarity score for a chunk to be considered a relevant answer.
// Cosine similarity on normalized embeddings; tunable via env.
const configuredThreshold = Number.parseFloat(process.env.RAG_SCORE_THRESHOLD || "0.15");
const SCORE_THRESHOLD = Number.isFinite(configuredThreshold) ? configuredThreshold : 0.15;

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
  // Clean up any stale temp files that may have been left from previous writes.
  try {
    const leftover = `${REGISTRY_PATH}.tmp`;
    if (fs.existsSync(leftover)) fs.unlinkSync(leftover);
  } catch { /* ok */ }
}

/**
 * Reformulate a natural-language question into multiple search-friendly
 * variants.  This bridges the gap between interrogative queries ("Who is the
 * mother of Harry Potter?") and the declarative sentences found in documents
 * ("Lily Potter was Harry's mother.").  Each variant is embedded separately
 * and the results are merged for better recall.
 */
function reformulateQuery(question) {
  const q = question.trim().replace(/[?？]+$/, "").trim();
  const variants = [q];

  // "Who is/was/are/were X" → "X", "X is/was"
  const whoM = q.match(/^[Ww]ho\s+(is|was|are|were)\s+(.+)/);
  if (whoM) {
    variants.push(whoM[2]);                       // "Harry Potter's mother"
    variants.push(`${whoM[2]} ${whoM[1]}`);       // "Harry Potter's mother is"
  }

  // "What is/was/are/were X" → "X", "X is/was"
  const whatM = q.match(/^[Ww]hat\s+(is|was|are|were)\s+(.+)/);
  if (whatM) {
    variants.push(whatM[2]);
    variants.push(`${whatM[2]} ${whatM[1]}`);
  }

  // "Where is/was/are/were X" → "X", "X located"
  const whereM = q.match(/^[Ww]here\s+(is|was|are|were)\s+(.+)/);
  if (whereM) {
    variants.push(whereM[2]);
    variants.push(`${whereM[2]} located`);
    variants.push(`location of ${whereM[2]}`);
  }

  // "When did/does/was/were X" → "X", "time X"
  const whenM = q.match(/^[Ww]hen\s+(did|does|was|were|is|are|will)\s+(.+)/);
  if (whenM) {
    variants.push(whenM[2]);
    variants.push(`time ${whenM[2]}`);
    variants.push(`date ${whenM[2]}`);
  }

  // "How did/does/is/was X" → "X"
  const howM = q.match(/^[Hh]ow\s+(did|does|do|is|are|was|were|can|to|many|much)\s+(.+)/);
  if (howM) {
    variants.push(howM[2]);
  }

  // "Why did/does X" → "X because"
  const whyM = q.match(/^[Ww]hy\s+(did|does|do|is|are|was|were|would)\s+(.+)/);
  if (whyM) {
    variants.push(`${whyM[2]} because`);
  }

  // "Describe/Explain/Tell me about X" → "X"
  const descM = q.match(/^(Describe|describe|Explain|explain|Tell|tell)\s+(me\s+)?(about\s+)?(.+)/);
  if (descM) {
    variants.push(descM[4]);
  }

  // Keyword-focused variant: extract important content words
  const words = q
    .replace(/[^\w\s']/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !/^(who|what|where|when|why|how|the|and|for|are|was|is|has|had|did|can|you|tell|me|about|does|were|will|would|could|should|have|been|being|that|this|with|from|which|their|they|them|your|its|all|not)$/i.test(w));
  if (words.length >= 2) {
    variants.push(words.join(" "));
  }

  return [...new Set(variants)];
}

/**
 * Template pool for generating diverse, contextual suggestions.
 * Rotated per document so every suggestion feels unique.
 */
const SUGGESTION_TEMPLATES = [
  (name) => `Summarize what "${name}" is about`,
  (name) => `What are the main topics covered in ${name}?`,
  (name) => `List the key characters or ideas from ${name}`,
  (name) => `Give me a quick overview of ${name}`,
  (name) => `What is the most important information in ${name}?`,
  (name) => `Break down the contents of ${name} for me`,
];

/**
 * Generate contextual search suggestions from the document registry when
 * no relevant matches are found.  This guides the user toward questions
 * that the uploaded PDFs can actually answer.
 * @param {string} originalQuestion The user's unmatched question (for reference)
 * @returns {string[]} Up to 6 suggested queries
 */
function generateSuggestions(originalQuestion) {
  const registry = loadRegistry();
  if (registry.length === 0) {
    return [
      "Upload a PDF to get started",
      "What kind of documents do you have?"
    ];
  }

  const suggestions = [];
  const usedTitles = new Set();
  let templateIndex = 0;

  // Extract meaningful titles from filenames
  for (const doc of registry) {
    const name = path.basename(doc.filename, path.extname(doc.filename))
      .replace(/[_-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Normalise multi-document variants: "Harry Potter 1", "Harry Potter 2" → "Harry Potter series"
    const base = name.replace(/\b(v|vol|volume|part|ch|ch|book|chapter)\s*\.?\s*\d+\b/gi, "").trim() || name;

    // Skip very short names
    const titleKey = base.toLowerCase().slice(0, 40);
    if (base.length < 3 || usedTitles.has(titleKey)) continue;
    usedTitles.add(titleKey);

    // Pick one template per document (rotate through the pool)
    const tpl = SUGGESTION_TEMPLATES[templateIndex % SUGGESTION_TEMPLATES.length];
    templateIndex++;
    suggestions.push(tpl(base));
  }

  // Add a couple of global "explore" suggestions (always useful)
  suggestions.push("What information is available in my PDFs?");
  suggestions.push("Give me an overview of all documents");

  // Trim to at most 6 unique suggestions
  return [...new Set(suggestions)].slice(0, 6);
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

  // Enforce a maximum of 10 PDFs.
  const registry = loadRegistry();
  if (registry.length >= 10) {
    const err = new Error("Maximum of 10 PDFs allowed. Please delete an existing document before uploading a new one.");
    err.statusCode = 409;
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

  registry.push(entry);
  saveRegistry(registry);

  return entry;
}

/**
 * Answer a question by retrieving the most relevant PDF chunks.
 * Uses multi-query retrieval: the question is reformulated into several
 * search variants, each is embedded and queried, then results are merged
 * for higher recall.
 * @param {string} question
 * @param {object} [opts]
 * @param {string} [opts.docId] Restrict search to a single document
 * @param {number} [opts.topk] Number of chunks to retrieve
 * @returns {Promise<object>}
 */
async function askQuestion(question, opts = {}) {
  const topk = Math.min(Math.max(parseInt(opts.topk, 10) || 10, 1), 30);
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

  // ---- Query preprocessing ----
  // Fix spelling, expand contractions/abbreviations, add synonyms.
  const { cleaned, corrected, enriched } = preprocessQuery(question);
  const processedQuestion = enriched;

  if (cleaned !== corrected) {
    console.log(`[QueryPreprocessor] "${question}" → "${corrected}"`);
  }

  // ---- Multi-query retrieval ----
  // Reformulate into search variants, embed all at once, query each, merge.
  const filter = opts.docId ? `docId == "${opts.docId}"` : null;
  const variants = reformulateQuery(processedQuestion);

  const queryVectors = await embedBatch(variants);

  // Deduplicate by chunk text, keeping the best score per chunk.
  const merged = new Map();

  for (const vector of queryVectors) {
    const results = (await DatabaseService.query(COLLECTION, vector, topk, filter)) || [];
    for (const r of results) {
      const key = r.fields?.text ?? "";
      if (!merged.has(key)) {
        merged.set(key, {
          score: r.score,
          text: key,
          source: r.fields?.source ?? "",
          page: r.fields?.page ?? null,
          docId: r.fields?.docId ?? null
        });
      } else {
        const existing = merged.get(key);
        if (r.score > existing.score) {
          existing.score = r.score;
        }
      }
    }
  }

  // Sort by score descending and keep the top-k across all variants.
  const matches = [...merged.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, topk);

  const relevant = matches.filter((m) => m.score >= SCORE_THRESHOLD);

  if (relevant.length === 0) {
    return {
      found: false,
      question,
      corrected: corrected !== cleaned ? corrected : undefined,
      message:
        "No relevant information for your question was found in the uploaded PDF(s). Try rephrasing, or upload a document that contains this information.",
      matches: [],
      suggestions: generateSuggestions(question)
    };
  }

  return {
    found: true,
    question,
    corrected: corrected !== cleaned ? corrected : undefined,
    answer: relevant.map((m) => m.text).join("\n\n---\n\n"),
    matches: relevant
  };
}

/** List all ingested PDFs. */
function listDocuments() {
  return loadRegistry();
}

/**
 * Delete an ingested PDF and all of its chunks from the vector DB,
 * then compact the collection to fully purge the data from disk.
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

  // 1. Remove all chunks belonging to this document from the vector index.
  await DatabaseService.deleteByFilter(COLLECTION, `docId == "${docId}"`);

  // 2. Compact / rebuild the collection so tombstoned records are truly
  //    purged from WAL, idmap SST, and scalar files on disk.
  DatabaseService.optimize(COLLECTION);

  // 3. Remove the document from the registry and persist.
  saveRegistry(registry.filter((d) => d.docId !== docId));

  return { docId, filename: entry.filename };
}

module.exports = { ingestPdf, askQuestion, listDocuments, deleteDocument, SCORE_THRESHOLD };
