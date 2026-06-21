# Vector DB PDF Search

A full-stack vector search application built with Express, React, and Alibaba's
[Zvec](https://github.com/alibaba/zvec). Upload text-based PDF files, index their
contents locally, search one or all uploaded documents, and inspect the retrieved
source passages and similarity scores.

The project also exposes a general-purpose API for storing and querying
768-dimensional document vectors.

## Features

- PDF upload and ingestion, with a 50 MB limit and PDF signature validation
- Page-aware text extraction and overlapping text chunks
- Local 384-dimensional embeddings using `Xenova/all-MiniLM-L6-v2`
- Retrieval across all PDFs or scoped to one uploaded document
- Relevance filtering with a configurable score threshold
- Persistent, in-process Zvec storage with no separate database server
- Responsive React, Vite, and Tailwind UI served by Express in production
- General 768-dimensional vector CRUD and similarity-search API
- Swagger/OpenAPI explorer at `/api-docs`
- Helmet security headers, configurable CORS, request logging, and JSON errors
- Health checks for both Zvec collections
- Deterministic PDF chunking tests

> The PDF question endpoint is extractive retrieval. Its `answer` is composed of
> the most relevant source passages; it does not call a generative LLM.

## Technology

| Area | Technology |
|---|---|
| Server | Node.js 18+, Express 5 |
| Vector database | `@zvec/zvec` 0.5 |
| Embeddings | `@xenova/transformers`, all-MiniLM-L6-v2 |
| PDF parsing | `pdf-parse` |
| Uploads | Multer memory storage |
| Client | React 18, Vite 5, Tailwind CSS 3 |
| API documentation | Swagger UI and swagger-jsdoc |
| Security and logging | Helmet, CORS, Morgan |

## Quick start

Prerequisites:

- Node.js 18 or newer
- npm
- A supported Zvec platform: Windows x64, Linux x64/ARM64, or macOS ARM64

```bash
npm install
cp .env.example .env
npm run build
npm start
```

Then open:

- Application UI: http://localhost:3000
- Swagger API explorer: http://localhost:3000/api-docs
- Health check: http://localhost:3000/api/health

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp` if
`cp` is unavailable.

The embedding model is downloaded and cached the first time a real PDF is
ingested. The initial download is approximately 90 MB and requires network
access. Asking a question when no PDFs exist does not load the model.

## Development

Run the server and Vite client in separate terminals:

```bash
# terminal 1: Express API on http://localhost:3000
npm run dev

# terminal 2: Vite UI on http://localhost:5173
npm run dev:client
```

Vite proxies `/api` requests to the Express server. In production,
`npm run build` creates `client/dist`, and Express serves that build from `/`.

## Available scripts

| Command | Purpose |
|---|---|
| `npm start` | Start the production Express server |
| `npm run dev` | Start the server with Nodemon |
| `npm run dev:client` | Start the Vite development server |
| `npm run build` | Build the React client for production |
| `npm test` | Run deterministic PDF chunking tests |
| `npm run check` | Run tests and build the client |

## Configuration

Create `.env` from [.env.example](.env.example):

```env
PORT=3000
NODE_ENV=development
RAG_SCORE_THRESHOLD=0.2
ZVEC_DATA_PATH=./zvec_data
# CORS_ORIGIN=http://localhost:5173
```

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP server port |
| `NODE_ENV` | unset | Use `development` to include stack traces in API errors |
| `RAG_SCORE_THRESHOLD` | `0.2` | Minimum inner-product score for a PDF passage to be returned |
| `ZVEC_DATA_PATH` | `<project>/zvec_data` | Persistent Zvec collections and PDF registry location |
| `CORS_ORIGIN` | all origins | Allowed browser origin when explicitly configured |

PDF embeddings are normalized, so their inner-product score is equivalent to
cosine similarity. Higher scores are more relevant.

## Application workflow

1. Upload a text-based PDF from the UI or `POST /api/pdf/upload`.
2. The server extracts text page by page.
3. Text is split into chunks of up to 1,000 characters with 200-character overlap.
4. Each chunk is embedded into a normalized 384-dimensional vector.
5. Chunks and metadata are stored in the `pdf_chunks` Zvec collection.
6. Questions are embedded with the same model and matched against relevant chunks.
7. Results below `RAG_SCORE_THRESHOLD` are omitted.

Scanned or image-only PDFs are not OCR-processed and normally return HTTP 422
because they contain no extractable text.

## API overview

All JSON responses contain a `success` boolean. Errors use this shape:

```json
{
  "success": false,
  "error": {
    "message": "Description of the problem"
  }
}
```

### Health endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server health and version |
| `GET` | `/api/health/zvec` | Statistics for `documents` and `pdf_chunks` |

### PDF endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/pdf/upload` | Upload and index a PDF |
| `POST` | `/api/pdf/ask` | Retrieve passages relevant to a question |
| `GET` | `/api/pdf/documents` | List uploaded PDF metadata |
| `DELETE` | `/api/pdf/documents/:docId` | Delete a PDF and all its chunks |

#### Upload a PDF

The multipart field must be named `file`. Files are held in memory while being
parsed and may not exceed 50 MB.

```bash
curl -X POST http://localhost:3000/api/pdf/upload \
  -F "file=@report.pdf"
```

Successful response:

```json
{
  "success": true,
  "message": "PDF ingested successfully",
  "data": {
    "docId": "5e98e2c7336f4e3a965579e83d56fbad",
    "filename": "report.pdf",
    "sizeBytes": 482113,
    "numPages": 12,
    "chunkCount": 34,
    "uploadedAt": "2026-06-21T10:00:00.000Z"
  }
}
```

#### Ask a question

`docId` is optional. Omit it to search every uploaded PDF. `topk` is optional
and must be an integer from 1 to 20; its default is 4. Questions are limited to
2,000 characters.

```bash
curl -X POST http://localhost:3000/api/pdf/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"What is the refund policy?","topk":4}'
```

When relevant content is found:

```json
{
  "success": true,
  "found": true,
  "question": "What is the refund policy?",
  "answer": "Refunds are issued within 30 days...",
  "matches": [
    {
      "score": 0.82,
      "text": "Refunds are issued within 30 days...",
      "source": "policy.pdf",
      "page": 3,
      "docId": "5e98e2c7336f4e3a965579e83d56fbad"
    }
  ]
}
```

When no content meets the threshold, the endpoint still returns HTTP 200 with
`found: false`, a user-facing message, and an empty `matches` array.

### General document-vector endpoints

These endpoints operate only on the `documents` collection. Every inserted or
query vector must contain exactly 768 finite numbers. `topk` must be an integer
from 1 to 100.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/documents/insert` | Insert an array of documents |
| `POST` | `/api/documents/insert-one` | Insert one document |
| `POST` | `/api/documents/query` | Similarity search with an optional scalar filter |
| `GET` | `/api/documents/fetch/:id` | Fetch a document by ID |
| `DELETE` | `/api/documents/:id` | Delete one document |
| `DELETE` | `/api/documents/batch` | Delete documents by ID array |
| `DELETE` | `/api/documents/filter` | Delete documents matching a filter |
| `GET` | `/api/documents/stats` | Read collection statistics |

Example query:

```json
POST /api/documents/query
{
  "collectionName": "documents",
  "queryVector": ["768 finite numeric values"],
  "topk": 5,
  "filter": "year > 2020"
}
```

The application seeds 12 sample records only when the `documents` collection is
empty. The sample vectors are normalized unit vectors.

## Storage schema

### `documents`

| Field | Type |
|---|---|
| `id` | String primary ID |
| `title` | String |
| `category` | String |
| `year` | Int32 |
| `embedding` | Float32 vector, 768 dimensions |

### `pdf_chunks`

| Field | Type |
|---|---|
| `id` | String primary ID (`docId_chunkIndex`) |
| `text` | String |
| `source` | Original sanitized filename |
| `docId` | String |
| `page` | Int32 |
| `chunkIndex` | Int32 |
| `embedding` | Float32 vector, 384 dimensions |

Uploaded-document metadata is stored atomically in
`<ZVEC_DATA_PATH>/pdf_registry.json`. Zvec uses write-ahead logging for durable
collection storage.

## Project structure

```text
.
|-- client/
|   |-- src/
|   |   |-- components/       Upload, document list, and chat UI
|   |   |-- api.js            PDF API client
|   |   `-- App.jsx           Responsive application layout
|   `-- vite.config.js        Vite config and development proxy
|-- src/
|   |-- config/
|   |   |-- database.js       Zvec collection and CRUD service
|   |   `-- swagger.js        OpenAPI definition
|   |-- middleware/           Upload, logging, and error middleware
|   |-- routes/               Health, document, and PDF endpoints
|   |-- services/             Embedding, PDF parsing, and retrieval logic
|   |-- utils/demoData.js     Conditional sample-data seed
|   `-- index.js              Express application entry point
|-- tests/pdfService.test.js  Deterministic chunking tests
|-- .env.example
`-- package.json
```

## Testing and verification

```bash
# Unit tests
npm test

# Unit tests plus production client build
npm run check
```

With the server running, basic smoke checks are also available:

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/health/zvec
curl http://localhost:3000/api/pdf/documents
```

`test-api.js` is a manual smoke-test client and expects a server to already be
running on port 3000.

## Operational notes

- Zvec collections are opened read-write by one application process. Starting a
  second server against the same `ZVEC_DATA_PATH` can fail with a collection lock
  error. Use a different data path for isolated test instances.
- The PDF registry and Zvec collection should be backed up together.
- Changing vector dimensions or index configuration requires a new collection or
  an explicit data migration.
- Upload processing is synchronous within the request and may take time for large
  PDFs because embeddings are generated chunk by chunk.
- The production UI is available only after `npm run build` creates `client/dist`.

## Security

- Helmet configures common HTTP security headers.
- CORS can be restricted with `CORS_ORIGIN`.
- JSON request bodies are limited to 10 MB.
- PDF uploads are limited to 50 MB and checked for a `%PDF-` signature.
- Filenames are sanitized before being persisted.
- API inputs, vector dimensions, numeric values, IDs, and query limits are validated.
- `.env` and `zvec_data/` are excluded from version control.

## License

ISC

Developer: Sandeep
