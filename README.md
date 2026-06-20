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
npm run dev
```

Open http://localhost:3000

---

## API Documentation

Interactive Swagger UI: http://localhost:3000/api-docs

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Basic health status |
| GET | `/api/health/zvec` | Zvec database connection stats |

### Documents

| Method | Path | Description |
|---|---|---|
| POST | `/api/documents/insert` | Insert multiple documents |
| POST | `/api/documents/insert-one` | Insert single document |
| POST | `/api/documents/query` | Vector similarity search |
| GET | `/api/documents/fetch/:id` | Fetch document by ID |
| DELETE | `/api/documents/:id` | Delete document by ID |
| POST | `/api/documents/batch` | Batch delete by IDs |
| POST | `/api/documents/filter` | Delete by filter condition |
| GET | `/api/documents/stats` | Collection statistics |

---

## Configuration

```env
PORT=3000
NODE_ENV=development
```

---

## Zvec Schema

- **Collection**: `documents`
- **Vector Dimensions**: 768 (float32)
- **Metric**: Cosine Similarity
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
    database.js      Zvec database service
    swagger.js       Swagger/OpenAPI config
  middleware/
    errorHandler.js  Global error handler
    requestLogger.js Morgan request logging
  routes/
    health.js        Health endpoints
    documents.js     Document CRUD + query
  utils/
    demoData.js      12-sample-doc seeder
  index.js           Express app entry point
```

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
