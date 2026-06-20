# Vector Database Demo Application

A production-ready demo application showcasing vector database functionality using the Zvec library by Alibaba. This application provides a complete API for managing vector embeddings, performing similarity searches, and handling vector data operations.

Developer: Sandeep

---

## Features

- **Vector Database Integration**: Powered by Zvec - a high-performance, in-process vector database
- **RESTful API**: Complete CRUD operations for vector data
- **Swagger Documentation**: Interactive API documentation at /api-docs
- **Health Check Endpoints**: Monitor application and database status
- **Error Handling**: Comprehensive error handling and logging
- **Security**: Helmet.js for HTTP security headers
- **Clean Architecture**: Well-organized folder structure with separation of concerns
- **Demo Data**: Pre-loaded sample data for immediate testing

---

## Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager

---

## Installation

1. Clone the repository:
```bash
git clone https://github.com/sandy13869/vector-db.git
cd vector-db
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Create a `.env` file for configuration:
```env
PORT=3000
NODE_ENV=development
```

---

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The application will start on `http://localhost:3000` by default.

---

## API Documentation

Interactive Swagger UI documentation is available at:
- **http://localhost:3000/api-docs**

---

## API Endpoints

### Health Check

#### Get Health Status
```
GET /api/health
```
Returns the basic health status of the application.

#### Get Zvec Status
```
GET /api/health/zvec
```
Returns detailed information about the Zvec database connection and statistics.

### Documents

#### Insert Multiple Documents
```
POST /api/documents/insert
Content-Type: application/json

{
  "collectionName": "documents",
  "documents": [
    {
      "id": "doc_1",
      "title": "Introduction to Machine Learning",
      "category": "AI",
      "year": 2020,
      "embedding": [0.1, 0.2, 0.3, 0.4, 0.5]
    }
  ]
}
```

#### Insert Single Document
```
POST /api/documents/insert-one
Content-Type: application/json

{
  "collectionName": "documents",
  "document": {
    "id": "doc_2",
    "title": "Deep Learning Fundamentals",
    "category": "AI",
    "year": 2021,
    "embedding": [0.2, 0.3, 0.4, 0.5, 0.6]
  }
}
```

#### Query Documents by Vector Similarity
```
POST /api/documents/query
Content-Type: application/json

{
  "collectionName": "documents",
  "queryVector": [0.1, 0.2, 0.3, 0.4, 0.5],
  "topk": 10,
  "filter": "year > 2020"
}
```

#### Fetch Document by ID
```
GET /api/documents/fetch/:id?collectionName=documents
```

#### Delete Document by ID
```
DELETE /api/documents/:id?collectionName=documents
```

#### Delete Multiple Documents
```
POST /api/documents/batch
Content-Type: application/json

{
  "collectionName": "documents",
  "ids": ["doc_1", "doc_2"]
}
```

#### Delete Documents by Filter
```
POST /api/documents/filter
Content-Type: application/json

{
  "collectionName": "documents",
  "filter": "year < 2020"
}
```

#### Get Collection Statistics
```
GET /api/documents/stats?collectionName=documents
```

---

## Project Structure

```
vector-db/
  src/
    config/
      database.js      # Zvec database service
      swagger.js       # Swagger documentation configuration
    middleware/
      errorHandler.js  # Error handling middleware
      requestLogger.js # Request logging middleware
    routes/
      health.js        # Health check endpoints
      documents.js     # Document management endpoints
    utils/
      demoData.js      # Demo data initialization
    index.js           # Application entry point
  public/              # Static files
  zvec_data/           # Zvec database files (auto-generated)
  .env                 # Environment variables
  .gitignore           # Git ignore rules
  package.json         # Project dependencies
  README.md            # This file
```

---

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development
```

### Zvec Configuration

The database schema is configured in `src/config/database.js`:

- **Collection**: `documents`
- **Fields**:
  - `id`: String (unique identifier)
  - `title`: String (document title)
  - `category`: String (document category)
  - `year`: Integer (publication year)
- **Vectors**:
  - `embedding`: Float32 vector (768 dimensions)

---

## Testing the API

### Using cURL

1. **Insert a document**:
```bash
curl -X POST http://localhost:3000/api/documents/insert \
  -H "Content-Type: application/json" \
  -d '{
    "collectionName": "documents",
    "documents": [{
      "id": "test_1",
      "title": "Test Document",
      "category": "Test",
      "year": 2023,
      "embedding": [0.1, 0.2, 0.3, 0.4, 0.5]
    }]
  }'
```

2. **Query documents**:
```bash
curl -X POST http://localhost:3000/api/documents/query \
  -H "Content-Type: application/json" \
  -d '{
    "collectionName": "documents",
    "queryVector": [0.1, 0.2, 0.3, 0.4, 0.5],
    "topk": 5
  }'
```

3. **Get health status**:
```bash
curl http://localhost:3000/api/health
```

### Using Postman

1. Import the Swagger documentation: `http://localhost:3000/api-docs`
2. Use the interactive UI to test all endpoints

---

## Zvec Features

This application demonstrates the following Zvec capabilities:

- **Vector Embeddings**: Store and search high-dimensional vectors
- **Similarity Search**: Find most similar vectors using cosine similarity
- **Filtering**: Filter search results using SQL-like conditions
- **Bulk Operations**: Insert and delete multiple documents efficiently
- **Persistent Storage**: Data is persisted to disk using write-ahead logging
- **Concurrent Access**: Support for multiple read operations simultaneously

---

## Security

- **Helmet.js**: Security headers middleware
- **CORS**: Cross-Origin Resource Sharing configured
- **Environment Variables**: Sensitive data stored in `.env` file (gitignored)
- **Input Validation**: Request validation and error handling

---

## License

ISC

Developer: Sandeep

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## Contact

Developer: Sandeep

---

## Acknowledgments

- Built with [Zvec](https://github.com/alibaba/zvec) - Alibaba's vector database
- Powered by [Express.js](https://expressjs.com/)
- API documentation with [Swagger](https://swagger.io/)

---

**Note**: This is a demo application. For production use, ensure proper authentication, rate limiting, and additional security measures are implemented.