const DatabaseService = require("../config/database");

function randomUnitVector(dimension) {
  const values = Array.from({ length: dimension }, () => Math.random());
  const magnitude = Math.hypot(...values);
  return values.map((value) => value / magnitude);
}

const demoDocuments = [
  { id: "doc_1", title: "Introduction to Machine Learning", category: "AI", year: 2020, embedding: randomUnitVector(768) },
  { id: "doc_2", title: "Deep Learning Fundamentals", category: "AI", year: 2021, embedding: randomUnitVector(768) },
  { id: "doc_3", title: "Natural Language Processing", category: "NLP", year: 2019, embedding: randomUnitVector(768) },
  { id: "doc_4", title: "Computer Vision Applications", category: "Computer Vision", year: 2022, embedding: randomUnitVector(768) },
  { id: "doc_5", title: "Big Data Analytics", category: "Data Science", year: 2020, embedding: randomUnitVector(768) },
  { id: "doc_6", title: "Cloud Computing Architecture", category: "Cloud", year: 2021, embedding: randomUnitVector(768) },
  { id: "doc_7", title: "Database Management Systems", category: "Database", year: 2018, embedding: randomUnitVector(768) },
  { id: "doc_8", title: "Cybersecurity Best Practices", category: "Security", year: 2022, embedding: randomUnitVector(768) },
  { id: "doc_9", title: "Microservices Architecture", category: "Architecture", year: 2021, embedding: randomUnitVector(768) },
  { id: "doc_10", title: "API Design Patterns", category: "API", year: 2020, embedding: randomUnitVector(768) },
  { id: "doc_11", title: "Machine Learning Algorithms", category: "AI", year: 2019, embedding: randomUnitVector(768) },
  { id: "doc_12", title: "Data Visualization Techniques", category: "Data Science", year: 2021, embedding: randomUnitVector(768) }
];

async function initializeDemoData() {
  try {
    const stats = DatabaseService.getStats("documents");
    if (stats.docCount > 0) {
      console.log(`Documents collection already contains ${stats.docCount} records; skipping demo seed`);
      return true;
    }
    await DatabaseService.insertDocuments("documents", demoDocuments);
    console.log(`✓ Successfully inserted ${demoDocuments.length} demo documents`);
    return true;
  } catch (error) {
    console.error("Failed to initialize demo data:", error);
    return false;
  }
}

module.exports = { demoDocuments, initializeDemoData };
