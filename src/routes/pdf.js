const express = require("express");
const router = express.Router();

const { uploadPdf } = require("../middleware/upload");
const ragService = require("../services/ragService");

/**
 * @openapi
 * /api/pdf/upload:
 *   post:
 *     tags:
 *       - PDF
 *     summary: Upload and ingest a PDF
 *     description: >
 *       Upload a PDF file (max 50 MB). The text is extracted, split into chunks,
 *       embedded with the all-MiniLM-L6-v2 model, and stored in the vector
 *       database so it can be queried with natural-language questions.
 *     operationId: uploadPdf
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The PDF file to upload (max 50 MB)
 *     responses:
 *       "200":
 *         description: PDF ingested successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/PdfUploadResponse"
 *             example:
 *               success: true
 *               message: PDF ingested successfully
 *               data:
 *                 docId: 3f6c1c2a-...
 *                 filename: report.pdf
 *                 sizeBytes: 482113
 *                 numPages: 12
 *                 chunkCount: 34
 *                 uploadedAt: "2026-06-21T10:00:00.000Z"
 *       "400":
 *         description: Missing file, wrong type, or file too large
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       "422":
 *         description: PDF contains no extractable text
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.post("/upload", uploadPdf, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: { message: "No PDF file uploaded. Use the 'file' form field." } });
    }
    if (req.file.buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
      return res.status(400).json({ success: false, error: { message: "The uploaded file is not a valid PDF" } });
    }

    const result = await ragService.ingestPdf(req.file.buffer, req.file.originalname);
    res.json({ success: true, message: "PDF ingested successfully", data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/pdf/ask:
 *   post:
 *     tags:
 *       - PDF
 *     summary: Ask a question about uploaded PDFs
 *     description: >
 *       Embeds the question and retrieves the most relevant chunks from the
 *       ingested PDF data using vector similarity search. If nothing relevant is
 *       found, responds with found=false and an explanatory message.
 *     operationId: askPdf
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/AskRequest"
 *           example:
 *             question: What is the refund policy?
 *             topk: 4
 *     responses:
 *       "200":
 *         description: Query executed (check the `found` flag)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/AskResponse"
 *             example:
 *               success: true
 *               found: true
 *               question: What is the refund policy?
 *               answer: Refunds are issued within 30 days...
 *               matches:
 *                 - score: 0.82
 *                   text: Refunds are issued within 30 days...
 *                   source: policy.pdf
 *                   page: 3
 *                   docId: 3f6c1c2a-...
 *       "400":
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.post("/ask", async (req, res, next) => {
  try {
    const { question, docId, topk } = req.body || {};

    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ success: false, error: { message: "A non-empty 'question' is required" } });
    }
    if (question.trim().length > 2000) {
      return res.status(400).json({ success: false, error: { message: "Question must be 2000 characters or fewer" } });
    }
    if (topk !== undefined && (!Number.isInteger(topk) || topk < 1 || topk > 20)) {
      return res.status(400).json({ success: false, error: { message: "topk must be an integer from 1 to 20" } });
    }

    const result = await ragService.askQuestion(question.trim(), { docId, topk });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/pdf/documents:
 *   get:
 *     tags:
 *       - PDF
 *     summary: List ingested PDFs
 *     description: Returns metadata for every PDF that has been uploaded and indexed.
 *     operationId: listPdfDocuments
 *     responses:
 *       "200":
 *         description: List of ingested PDFs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/PdfListResponse"
 */
router.get("/documents", (req, res, next) => {
  try {
    const documents = ragService.listDocuments();
    res.json({ success: true, count: documents.length, data: documents });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/pdf/documents/{docId}:
 *   delete:
 *     tags:
 *       - PDF
 *     summary: Delete an ingested PDF
 *     description: Removes a PDF and all of its chunks from the vector database.
 *     operationId: deletePdfDocument
 *     parameters:
 *       - in: path
 *         name: docId
 *         required: true
 *         schema:
 *           type: string
 *         description: The document ID returned at upload time
 *     responses:
 *       "200":
 *         description: Document deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/SuccessResponse"
 *       "404":
 *         description: Document not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.delete("/documents/:docId", async (req, res, next) => {
  try {
    const result = await ragService.deleteDocument(req.params.docId);
    res.json({ success: true, message: "Document deleted successfully", data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
