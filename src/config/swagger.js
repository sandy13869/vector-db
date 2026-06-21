const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Vector Database API",
      version: "1.0.0",
      description: `
Demo vector database application using **Zvec** — a lightweight, lightning-fast, in-process vector database by Alibaba.

## Capabilities
- **Vector Storage** — Store high-dimensional vector embeddings (768d float32)
- **Similarity Search** — Find nearest neighbors using cosine similarity
- **Filtered Search** — Combine vector similarity with scalar field filters
- **CRUD Operations** — Insert, fetch, query, and delete vector documents
- **Hybrid Filtering** — SQL-like filter expressions (\`year > 2020\`)
`,
      contact: {
        name: "Sandeep",
        url: "https://github.com/sandy13869"
      },
      license: {
        name: "ISC",
        url: "https://opensource.org/licenses/ISC"
      }
    },
    servers: [
      {
        url: "/",
        description: "Current server"
      },
      {
        url: "http://localhost:3000",
        description: "Development server"
      }
    ],
    components: {
      schemas: {
        // ---------- Common ----------
        ErrorBody: {
          type: "object",
          properties: {
            message: { type: "string", example: "Collection name is required" },
            stack: { type: "string", description: "Stack trace (development only)" }
          }
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { $ref: "#/components/schemas/ErrorBody" }
          }
        },
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true }
          }
        },

        // ---------- Health ----------
        HealthResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            status: { type: "string", example: "healthy" },
            timestamp: { type: "string", format: "date-time", example: "2026-06-20T12:00:00.000Z" },
            version: { type: "string", example: "1.0.0" }
          }
        },
        ZvecStats: {
          type: "object",
          properties: {
            docCount: { type: "integer", example: 12, description: "Number of documents in the collection" },
            indexCompleteness: {
              type: "object",
              additionalProperties: { type: "number", example: 1 },
              description: "Index build progress per vector field (0–1)"
            }
          }
        },
        ZvecHealthResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            status: { type: "string", example: "zvec-connected" },
            timestamp: { type: "string", format: "date-time" },
            version: { type: "string", example: "1.0.0" },
            zvec: {
              type: "object",
              properties: {
                documents: { $ref: "#/components/schemas/ZvecStats" }
              }
            }
          }
        },

        // ---------- Root ----------
        RootResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Vector Database API" },
            version: { type: "string", example: "1.0.0" },
            documentation: { type: "string", example: "/api-docs" }
          }
        },

        // ---------- Document ----------
        Document: {
          type: "object",
          required: ["id", "embedding"],
          properties: {
            id: { type: "string", example: "doc_1", description: "Unique document identifier" },
            title: { type: "string", example: "Introduction to Machine Learning" },
            category: { type: "string", example: "AI" },
            year: { type: "integer", example: 2020 },
            embedding: {
              type: "array",
              items: { type: "number", format: "float" },
              minItems: 768,
              maxItems: 768,
              example: [0.1, 0.2, 0.3],
              description: "768-dimensional float32 vector embedding"
            }
          }
        },
        InsertOneRequest: {
          type: "object",
          required: ["collectionName", "document"],
          properties: {
            collectionName: { type: "string", example: "documents", description: "Target collection name" },
            document: { $ref: "#/components/schemas/Document" }
          }
        },
        InsertRequest: {
          type: "object",
          required: ["collectionName", "documents"],
          properties: {
            collectionName: { type: "string", example: "documents" },
            documents: {
              type: "array",
              items: { $ref: "#/components/schemas/Document" },
              minItems: 1,
              description: "Array of documents to insert"
            }
          }
        },
        InsertResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Documents inserted successfully" },
            count: { type: "integer", example: 12 }
          }
        },
        InsertOneResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Document inserted successfully" },
            data: { $ref: "#/components/schemas/Document" }
          }
        },

        // ---------- Query ----------
        QueryRequest: {
          type: "object",
          required: ["collectionName", "queryVector"],
          properties: {
            collectionName: { type: "string", example: "documents" },
            queryVector: {
              type: "array",
              items: { type: "number", format: "float" },
              minItems: 768,
              maxItems: 768,
              description: "Query vector for similarity search (768 dimensions)",
              example: [0.1, 0.2, 0.3]
            },
            topk: {
              type: "integer",
              default: 10,
              minimum: 1,
              maximum: 100,
              description: "Number of nearest neighbors to return"
            },
            filter: {
              type: "string",
              description: "Optional SQL-like filter expression (e.g. year > 2020)",
              example: "year > 2020"
            }
          }
        },
        QueryResultItem: {
          type: "object",
          properties: {
            id: { type: "string", example: "doc_1" },
            score: { type: "number", format: "float", example: 0.95, description: "Similarity score (higher = more similar)" },
            vectors: {
              type: "object",
              additionalProperties: { type: "array", items: { type: "number" } }
            },
            fields: {
              type: "object",
              properties: {
                title: { type: "string" },
                category: { type: "string" },
                year: { type: "integer" }
              }
            }
          }
        },
        QueryResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Query executed successfully" },
            count: { type: "integer", example: 3 },
            results: {
              type: "array",
              items: { $ref: "#/components/schemas/QueryResultItem" }
            }
          }
        },

        // ---------- Fetch ----------
        FetchResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              description: "Map of document IDs to document objects",
              additionalProperties: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  score: { type: "number" },
                  vectors: { type: "object" },
                  fields: { type: "object" }
                }
              }
            }
          }
        },

        // ---------- Delete ----------
        DeleteResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Document deleted successfully" },
            data: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                deletedId: { type: "string", example: "doc_1" }
              }
            }
          }
        },
        BatchDeleteResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Documents deleted successfully" },
            data: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true },
                deletedCount: { type: "integer", example: 2 }
              }
            }
          }
        },
        FilterDeleteResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Documents deleted successfully by filter" },
            data: {
              type: "object",
              properties: {
                success: { type: "boolean", example: true }
              }
            }
          }
        },
        BatchDeleteRequest: {
          type: "object",
          required: ["collectionName", "ids"],
          properties: {
            collectionName: { type: "string", example: "documents" },
            ids: {
              type: "array",
              items: { type: "string" },
              minItems: 1,
              example: ["doc_1", "doc_2"],
              description: "Array of document IDs to delete"
            }
          }
        },
        FilterDeleteRequest: {
          type: "object",
          required: ["collectionName", "filter"],
          properties: {
            collectionName: { type: "string", example: "documents" },
            filter: { type: "string", example: "year < 2020", description: "Filter condition to match documents for deletion" }
          }
        },

        // ---------- PDF ----------
        PdfDocument: {
          type: "object",
          properties: {
            docId: { type: "string", example: "3f6c1c2a-9b1e-4f0a-bc12-2e6d8f1a0c34" },
            filename: { type: "string", example: "report.pdf" },
            sizeBytes: { type: "integer", example: 482113 },
            numPages: { type: "integer", example: 12 },
            chunkCount: { type: "integer", example: 34 },
            uploadedAt: { type: "string", format: "date-time", example: "2026-06-21T10:00:00.000Z" }
          }
        },
        PdfUploadResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "PDF ingested successfully" },
            data: { $ref: "#/components/schemas/PdfDocument" }
          }
        },
        PdfListResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            count: { type: "integer", example: 1 },
            data: { type: "array", items: { $ref: "#/components/schemas/PdfDocument" } }
          }
        },
        AskRequest: {
          type: "object",
          required: ["question"],
          properties: {
            question: { type: "string", example: "What is the refund policy?", description: "Natural-language question" },
            docId: { type: "string", description: "Optional: restrict the search to a single uploaded PDF" },
            topk: { type: "integer", default: 4, minimum: 1, maximum: 20, description: "Number of chunks to retrieve" }
          }
        },
        AskMatch: {
          type: "object",
          properties: {
            score: { type: "number", format: "float", example: 0.82, description: "Cosine similarity (higher = more relevant)" },
            text: { type: "string", example: "Refunds are issued within 30 days..." },
            source: { type: "string", example: "policy.pdf" },
            page: { type: "integer", example: 3 },
            docId: { type: "string", example: "3f6c1c2a-..." }
          }
        },
        AskResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            found: { type: "boolean", example: true, description: "False when no chunk passes the relevance threshold" },
            question: { type: "string", example: "What is the refund policy?" },
            answer: { type: "string", description: "Concatenated relevant passages (present when found=true)" },
            message: { type: "string", description: "Explanation shown when found=false" },
            matches: { type: "array", items: { $ref: "#/components/schemas/AskMatch" } }
          }
        },

        // ---------- Stats ----------
        StatsResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { $ref: "#/components/schemas/ZvecStats" }
          }
        }
      }
    }
  },
  apis: ["./src/routes/*.js", "./src/index.js"]
};

module.exports = swaggerJsdoc(options);
