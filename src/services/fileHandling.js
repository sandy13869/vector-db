const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");
const { pipeline } = require("@xenova/transformers");
const { ZVecCollectionSchema, ZVecCreateAndOpen, ZVecOpen, ZVecDataType } = require("@zvec/zvec");

async function main() {
  // Load PDF
  const pdfBuffer = fs.readFileSync("D:/PRACTICE/DOCS/Doc_3.pdf");
  const pdfData = await pdf(pdfBuffer);

  // Chunk PDF
  const chunks = pdfData.text
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((text, index) => ({
      page: index + 1,
      text: text.trim(),
    }));

  // Load embedding model
  const embedder = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2"
  );

  // Create embeddings
  const embeddings = [];

  for (const chunk of chunks) {
    const output = await embedder(chunk.text, {
      pooling: "mean",
      normalize: true,
    });

    embeddings.push(Array.from(output.data));
  }

  // Create or open collection
  const collectionPath = "./pdf_collection";
  const schema = new ZVecCollectionSchema({
    name: "pdf_search",
    vectors: {
      name: "embedding",
      dataType: ZVecDataType.VECTOR_FP32,
      dimension: 384,
    },
  });

  const collection = fs.existsSync(collectionPath)
    ? ZVecOpen(collectionPath)
    : ZVecCreateAndOpen(collectionPath, schema);

  // Insert docs
  collection.insertSync(
    embeddings.map((embedding, idx) => ({
      id: `doc_${idx + 1}`,
      vectors: {
        embedding,
      },
    }))
  );

  // Build index
  collection.optimizeSync();

  // Search
  const query = "What is the main topic of the document?";

  const queryEmbedding = await embedder(query, {
    pooling: "mean",
    normalize: true,
  });

  const queryVec = Array.from(queryEmbedding.data);

  const results = collection.querySync({
    fieldName: "embedding",
    vector: queryVec,
    topk: 3,
  });

  for (const result of results) {
    const pageIdx = Number(result.id.split("_")[1]) - 1;

    console.log(
      `Page ${chunks[pageIdx].page} (score=${result.score})`
    );
    console.log(chunks[pageIdx].text.substring(0, 300));
    console.log("-".repeat(80));
  }
}

main().catch(console.error);