require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const fs = require("fs");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");
const healthRoutes = require("./routes/health");
const documentsRoutes = require("./routes/documents");
const pdfRoutes = require("./routes/pdf");
const { initializeDemoData } = require("./utils/demoData");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());

app.use(cors({ origin: process.env.CORS_ORIGIN || true }));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(requestLogger);

app.use("/api/health", healthRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/pdf", pdfRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const clientDist = path.resolve(__dirname, "../client/dist");
const hasClientBuild = fs.existsSync(path.join(clientDist, "index.html"));
if (hasClientBuild) app.use(express.static(clientDist));

/**
 * @openapi
 * /:
 *   get:
 *     tags:
 *       - Root
 *     summary: API root
 *     description: Returns basic API information and links to documentation.
 *     operationId: root
 *     responses:
 *       "200":
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/RootResponse"
 *             example:
 *               success: true
 *               message: Vector Database API
 *               version: "1.0.0"
 *               documentation: /api-docs
 */
app.get("/", (req, res) => {
  if (hasClientBuild) return res.sendFile(path.join(clientDist, "index.html"));
  res.json({
    success: true,
    message: "Vector Database API",
    version: "1.0.0",
    documentation: "/api-docs"
  });
});

// Let client-side routes render through React when a production build exists.
if (hasClientBuild) {
  app.get("/{*path}", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    return res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: "Route not found"
    }
  });
});

app.use(errorHandler);

async function startServer() {
  try {
    const DatabaseService = require("./config/database");

    await DatabaseService.init();
    console.log("✓ Database initialized successfully");

    await initializeDemoData();

    const server = app.listen(PORT, () => {
      console.log(`

  Vector Database API - Zvec Demo
  Developer: Sandeep

  Server running on http://localhost:${PORT}

  API Documentation: http://localhost:${PORT}/api-docs

  Health Check:
    - Base: http://localhost:${PORT}/api/health
    - Zvec Status: http://localhost:${PORT}/api/health/zvec

  Endpoints:
    - Health: /api/health
    - Documents: /api/documents
    - PDF (upload / ask): /api/pdf

  Press Ctrl+C to stop the server
      `);
    });

    const shutdown = (signal) => {
      console.log(`\n${signal} received; shutting down.`);
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(1), 10_000).unref();
    };
    process.once("SIGINT", () => shutdown("SIGINT"));
    process.once("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
