# Vector Database API

[![Node Version](https://img.shields.io/badge/node-%3E%3D18.x-brightgreen)](https://nodejs.org)
[![Express](https://img.shields.io/badge/express-4.21-blue)](https://expressjs.com)
[![Zvec](https://img.shields.io/badge/zvec-0.0.x-orange)](https://github.com/alibaba/zvec)
[![License](https://img.shields.io/badge/license-ISC-lightgrey)](LICENSE)
[![Author](https://img.shields.io/badge/author-Sandeep-blueviolet)](https://github.com/sandy13869)

A production-ready demo application showcasing vector database functionality using the **Zvec** library by Alibaba. This application provides a complete API for managing vector embeddings, performing similarity searches, and handling vector data operations.

**Author**: Sandeep  
**License**: ISC  
**Node**: >= 18.x  

---

## Tech Stack

| Category | Technology | Version |
|---|---|---|
| Runtime | Node.js | >= 18.x |
| Framework | Express | 4.21.x |
| Vector DB | Zvec | 0.0.x |
| Docs | swagger-jsdoc / swagger-ui-express | Latest |
| Security | Helmet | Latest |
| Logging | Morgan | Latest |

---

## Features

- **PDF Question Answering (RAG)** — Upload a PDF (≤ 50 MB), it is chunked, embedded, and stored in the vector DB; ask natural-language questions and get answers retrieved from the document
- **Relevance gating** — When nothing relevant is found, the API responds with `found: false` and a clear message instead of returning noise
- **React UI** — Vite + Tailwind single-page app for drag-and-drop upload and a chat-style Q&A interface (`client/`)
- Vector Database Integration — Zvec high-performance in-process vector DB
- RESTful API — Full CRUD for vector data
- Swagger Documentation — Interactive UI at `/api-docs`
- Health Check Endpoints — Monitor app and database status
- Similarity Search — Cosine similarity with scalar field filtering
- Error Handling — Centralized error middleware
- Security — Helmet.js HTTP headers + CORS
- Demo Data — 12 pre-loaded documents for immediate testing

---

## Quick Start

```bash
npm install
cp .env.example .env    # or create .env manually (see Configuration)
npm run build
npm start
```

Open http://localhost:3000 for the UI or http://localhost:3000/api-docs for the API explorer.

> The first call to `/api/pdf/upload` or `/api/pdf/ask` downloads the
> `all-MiniLM-L6-v2` embedding model (~90 MB) once and caches it locally.

---

## API Documentation

Interactive Swagger UI: http://localhost:3000/api-docs

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Basic health status |
| GET | `/api/health/zvec` | Zvec database connection stats |

### PDF Question Answering

| Method | Path | Description |
|---|---|---|
| POST | `/api/pdf/upload` | Upload + ingest a PDF (`multipart/form-data`, field `file`, ≤ 50 MB) |
| POST | `/api/pdf/ask` | Ask a question; retrieves relevant chunks from ingested PDFs |
| GET | `/api/pdf/documents` | List ingested PDFs |
| DELETE | `/api/pdf/documents/:docId` | Delete an ingested PDF and its chunks |

**Ask response** — when relevant content is found:

```json
{ "success": true, "found": true, "question": "...", "answer": "...", "matches": [ { "score": 0.82, "text": "...", "source": "doc.pdf", "page": 3, "docId": "..." } ] }
```

When nothing relevant is found:

```json
{ "success": true, "found": false, "message": "No relevant information for your question was found in the uploaded PDF(s)...", "matches": [] }
```

### Documents

| Method | Path | Description |
|---|---|---|
| POST | `/api/documents/insert` | Insert multiple documents |
| POST | `/api/documents/insert-one` | Insert single document |
| POST | `/api/documents/query` | Vector similarity search |
| GET | `/api/documents/fetch/:id` | Fetch document by ID |
| DELETE | `/api/documents/:id` | Delete document by ID |
| DELETE | `/api/documents/batch` | Batch delete by IDs |
| DELETE | `/api/documents/filter` | Delete by filter condition |
| GET | `/api/documents/stats` | Collection statistics |

---

## Configuration

```env
PORT=3000
NODE_ENV=development
# Minimum cosine similarity for a PDF chunk to count as a relevant answer (default 0.2)
RAG_SCORE_THRESHOLD=0.2
# Optional persistent-data location and browser origin
ZVEC_DATA_PATH=./zvec_data
CORS_ORIGIN=http://localhost:5173
```

---

## Zvec Schema

- **Collection**: `documents`
- **Vector Dimensions**: 768 (float32)
- **Metric**: Inner product (equivalent to cosine similarity for normalized embeddings)
- **Index**: HNSW
- **Storage**: Persistent (write-ahead logging)

| Field | Type |
|---|---|
| id | String |
| title | String |
| category | String |
| year | Integer |
| embedding | Float32[768] |

---

## Testing

```bash
# Run the automated test script
node test-api.js

# Or use curl
curl http://localhost:3000/api/health
curl http://localhost:3000/api/health/zvec
```

---

## Project Structure

```
src/
  config/
    database.js        Zvec database service (documents + pdf_chunks collections)
    swagger.js         Swagger/OpenAPI config
  middleware/
    errorHandler.js    Global error handler
    requestLogger.js   Morgan request logging
    upload.js          Multer PDF upload (50 MB limit, PDF-only)
  routes/
    health.js          Health endpoints
    documents.js       Document CRUD + query
    pdf.js             PDF upload / ask / list / delete
  services/
    embeddingService.js  all-MiniLM-L6-v2 text embeddings (384-d)
    pdfService.js        PDF text extraction + chunking
    ragService.js        Ingest + retrieval + document registry
  utils/
    demoData.js        12-sample-doc seeder
  index.js             Express app entry point

client/                React + Vite + Tailwind UI
  src/
    api.js             Backend API client
    App.jsx            Layout (upload + document list + chat)
    components/        UploadPanel, DocumentList, ChatPanel
```

---

## Frontend (React + Vite + Tailwind)

A single-page UI lives in [client/](client/): drag-and-drop PDF upload with progress,
a document list (scope questions to one PDF or search all), and a chat-style Q&A panel
that shows answers with their source passages and similarity scores.

```bash
# terminal 1
npm run dev

# terminal 2
npm run dev:client  # http://localhost:5173, proxies /api to :3000
```

For production, `npm run build && npm start` serves the compiled UI and API from port 3000.

---

## Security

- Helmet.js — HTTP security headers
- CORS — Cross-origin access control
- dotenv — Environment variable management
- Input validation on all routes
- `.env` and `zvec_data/` in `.gitignore`

---

## License

ISC

**Developer**: Sandeep
