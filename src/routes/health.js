const express = require("express");
const router = express.Router();

/**
 * @openapi
 * /api/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Basic health check
 *     description: Returns the current health status of the API server.
 *     operationId: healthCheck
 *     responses:
 *       "200":
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/HealthResponse"
 *             example:
 *               success: true
 *               status: healthy
 *               timestamp: "2026-06-20T12:00:00.000Z"
 *               version: "1.0.0"
 */
router.get("/", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

/**
 * @openapi
 * /api/health/zvec:
 *   get:
 *     tags:
 *       - Health
 *     summary: Zvec database health check
 *     description: Returns detailed status of the Zvec vector database connection and collection statistics.
 *     operationId: zvecHealth
 *     responses:
 *       "200":
 *         description: Zvec is connected and operational
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ZvecHealthResponse"
 *             example:
 *               success: true
 *               status: zvec-connected
 *               timestamp: "2026-06-20T12:00:00.000Z"
 *               version: "1.0.0"
 *               zvec:
 *                 documents:
 *                   docCount: 12
 *                   indexCompleteness:
 *                     embedding: 1
 *       "500":
 *         description: Zvec connection failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *             example:
 *               success: false
 *               error:
 *                 message: "Collection documents does not exist"
 */
router.get("/zvec", async (req, res) => {
  try {
    const DatabaseService = require("../config/database");
    const [documents, pdfChunks] = await Promise.all([
      DatabaseService.getStats("documents"),
      DatabaseService.getStats("pdf_chunks")
    ]);

    res.json({
      success: true,
      status: "zvec-connected",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      zvec: { documents, pdfChunks }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

module.exports = router;
