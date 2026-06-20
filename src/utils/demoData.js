const DatabaseService = require("../config/database");

const demoDocuments = [
  { id: "doc_1", title: "Introduction to Machine Learning", category: "AI", year: 2020, embedding: Array(768).fill(0).map(() => Math.random()) },
  { id: "doc_2", title: "Deep Learning Fundamentals", category: "AI", year: 2021, embedding: Array(768).fill(0).map(() => Math.random()) },
  { id: "doc_3", title: "Natural Language Processing", category: "NLP", year: 2019, embedding: Array(768).fill(0).map(() => Math.random()) },
  { id: "doc_4", title: "Computer Vision Applications", category: "Computer Vision", year: 2022, embedding: Array(768).fill(0).map(() => Math.random()) },
  { id: "doc_5", title: "Big Data Analytics", category: "Data Science", year: 2020, embedding: Array(768).fill(0).map(() => Math.random()) },
  { id: "doc_6", title: "Cloud Computing Architecture", category: "Cloud", year: 2021, embedding: Array(768).fill(0).map(() => Math.random()) },
  { id: "doc_7", title: "Database Management Systems", category: "Database", year: 2018, embedding: Array(768).fill(0).map(() => Math.random()) },
  { id: "doc_8", title: "Cybersecurity Best Practices", category: "Security", year: 2022, embedding: Array(768).fill(0).map(() => Math.random()) },
  { id: "doc_9", title: "Microservices Architecture", category: "Architecture", year: 2021, embedding: Array(768).fill(0).map(() => Math.random()) },
  { id: "doc_10", title: "API Design Patterns", category: "API", year: 2020, embedding: Array(768).fill(0).map(() => Math.random()) },
  { id: "doc_11", title: "Machine Learning Algorithms", category: "AI", year: 2019, embedding: Array(768).fill(0).map(() => Math.random()) },
  { id: "doc_12", title: "Data Visualization Techniques", category: "Data Science", year: 2021, embedding: Array(768).fill(0).map(() => Math.random()) }
];

async function initializeDemoData() {
  try {
    await DatabaseService.insertDocuments("documents", demoDocuments);
    console.log(`✓ Successfully inserted ${demoDocuments.length} demo documents`);
    return true;
  } catch (error) {
    console.error("Failed to initialize demo data:", error);
    return false;
  }
}

module.exports = { demoDocuments, initializeDemoData };