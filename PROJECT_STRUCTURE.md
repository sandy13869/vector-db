# Vector Database Demo - Project Structure

## 📁 Complete File Structure

```
vector-db/
├── .commandcode/              # Command Code configuration (hidden)
├── .git/
├── .gitignore                 # Git ignore rules (strict security)
├── .env                       # Environment variables (gitignored)
├── index.js                   # Original file (empty, kept for reference)
├── package.json               # Project dependencies and scripts
├── package-lock.json          # Dependency lock file
├── README.md                  # Complete documentation
├── PROJECT_STRUCTURE.md       # This file
├── test-api.js                # API testing script
├── node_modules/              # Dependencies (gitignored)
├── src/                       # Source code directory
│   ├── index.js              # Application entry point
│   ├── config/               # Configuration files
│   │   ├── database.js       # Zvec database service layer
│   │   └── swagger.js        # Swagger API documentation config
│   ├── middleware/           # Express middleware
│   │   ├── errorHandler.js   # Global error handler
│   │   └── requestLogger.js  # Request logging middleware
│   ├── routes/               # API routes
│   │   ├── health.js         # Health check endpoints
│   │   └── documents.js      # Document management endpoints
│   └── utils/                # Utility functions
│       └── demoData.js       # Demo data initialization
└── public/                   # Static files directory
```

## 🏗️ Architecture Overview

### 1. Application Entry Point (`src/index.js`)
- Initializes Express app
- Configures middleware (helmet, cors, body parsers)
- Sets up routes
- Initializes database and loads demo data
- Starts server

### 2. Database Service (`src/config/database.js`)
- Singleton pattern for database connection
- Manages Zvec collections
- Provides CRUD operations for vector data
- Handles optimization and statistics

### 3. API Routes (`src/routes/`)
- **Health Routes** (`health.js`):
  - Basic health check
  - Zvec database connection status
- **Documents Routes** (`documents.js`):
  - Insert documents (bulk and single)
  - Query documents by vector similarity
  - Fetch documents by ID
  - Delete documents (by ID, batch, or filter)
  - Get collection statistics

### 4. Middleware (`src/middleware/`)
- **Request Logger**: Logs all HTTP requests
- **Error Handler**: Centralized error handling

### 5. Configuration (`src/config/`)
- **Database Configuration**: Zvec schema and connection
- **Swagger Configuration**: OpenAPI documentation

### 6. Utilities (`src/utils/`)
- **Demo Data**: Pre-loaded sample documents for testing

## 🔄 Data Flow

1. **Initialization**:
   - Application starts
   - Database service initializes Zvec collection
   - Demo data is loaded automatically

2. **API Request**:
   - Request hits Express app
   - Middleware processes request (logging, security)
   - Routes handle specific endpoints
   - Database service performs operations
   - Response is sent back

3. **Database Operations**:
   - Zvec handles vector storage and search
   - Data is persisted to disk
   - Index is optimized for fast queries

## 📡 API Endpoints Summary

### Health
- `GET /` - Application info
- `GET /api/health` - Health status
- `GET /api/health/zvec` - Zvec status

### Documents
- `POST /api/documents/insert` - Insert multiple
- `POST /api/documents/insert-one` - Insert single
- `POST /api/documents/query` - Vector similarity search
- `GET /api/documents/fetch/:id` - Fetch by ID
- `DELETE /api/documents/:id` - Delete by ID
- `POST /api/documents/batch` - Delete multiple
- `POST /api/documents/filter` - Delete by filter
- `GET /api/documents/stats` - Get statistics

## 🚀 Quick Start

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Access the API:
- Swagger Docs: http://localhost:3000/api-docs
- Health Check: http://localhost:3000/api/health

4. Test the API:
```bash
node test-api.js
```

## 📊 Zvec Configuration

- **Collection Name**: `documents`
- **Vector Dimensions**: 768
- **Index Type**: HNSW (Hierarchical Navigable Small World)
- **Metric**: Cosine Similarity
- **Storage**: Persistent with WAL (Write-Ahead Logging)

## 🔒 Security Features

- Helmet.js for HTTP security headers
- CORS enabled for cross-origin requests
- Environment variables for sensitive configuration
- Input validation in routes
- Error messages sanitized for production

## 📝 Key Features Implemented

✅ Complete REST API with CRUD operations
✅ Swagger/OpenAPI documentation
✅ Health check endpoints
✅ Error handling middleware
✅ Request logging
✅ Demo data initialization
✅ Vector similarity search
✅ Filtering capabilities
✅ Persistent storage
✅ Clean architecture
✅ Well-organized code structure

## 🎯 Next Steps

To extend this application:

1. Add authentication (JWT)
2. Implement rate limiting
3. Add more collections for different data types
4. Create API versioning
5. Add unit tests
6. Implement caching layer
7. Add data export/import functionality
8. Create admin dashboard

---

**Note**: This is a demo application. For production deployment, consider adding:
- Authentication and authorization
- Rate limiting
- Monitoring and logging
- Backup and recovery strategies
- Load balancing for high traffic
- Containerization (Docker/Kubernetes)