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
 * Embed an array of texts sequentially, returning one vector per input.
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
async function embedBatch(texts) {
  const vectors = [];
  for (const text of texts) {
    vectors.push(await embedText(text));
  }
  return vectors;
}

module.exports = { embedText, embedBatch, getEmbedder, EMBEDDING_DIMENSION, MODEL_NAME };
