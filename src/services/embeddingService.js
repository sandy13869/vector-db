const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";
const EMBEDDING_DIMENSION = 384;

let embedderPromise = null;

/**
 * Lazily load the feature-extraction pipeline. The model is downloaded once on
 * first use and cached by @xenova/transformers, so subsequent calls are cheap.
 */
async function getEmbedder() {
  if (!embedderPromise) {
    const { pipeline } = await import("@xenova/transformers");
    embedderPromise = pipeline("feature-extraction", MODEL_NAME);
  }
  return embedderPromise;
}

/**
 * Embed a single piece of text into a normalized 384-dimensional vector.
 * @param {string} text
 * @returns {Promise<number[]>}
 */
async function embedText(text) {
  const embedder = await getEmbedder();
  const output = await embedder(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

/**
 * Embed an array of texts in batches, returning one vector per input.
 * Batched inference is much faster (~10-20x) than sequential on large PDFs.
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
async function embedBatch(texts) {
  const embedder = await getEmbedder();

  // @xenova/transformers supports batched inference — split into manageable
  // batches to avoid OOM on large documents.
  const BATCH_SIZE = 32;
  const vectors = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const output = await embedder(batch, { pooling: "mean", normalize: true });
    // output.data is a flat Float32Array of shape [batchSize, 384]
    for (let j = 0; j < batch.length; j++) {
      const start = j * EMBEDDING_DIMENSION;
      vectors.push(Array.from(output.data.slice(start, start + EMBEDDING_DIMENSION)));
    }
  }

  return vectors;
}

module.exports = { embedText, embedBatch, getEmbedder, EMBEDDING_DIMENSION, MODEL_NAME };
