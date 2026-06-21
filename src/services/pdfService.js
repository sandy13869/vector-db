const pdf = require("pdf-parse");

// Chunking configuration (characters). Overlap preserves context across boundaries.
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

/**
 * Extract text from a PDF buffer, keeping per-page text so retrieved chunks can
 * cite the page they came from.
 * @param {Buffer} buffer
 * @returns {Promise<{ pages: string[], numPages: number, fullText: string }>}
 */
async function extractPages(buffer) {
  const pages = [];

  // pdf-parse invokes this callback once per page; we capture each page's text.
  const renderPage = (pageData) => {
    return pageData
      .getTextContent({ normalizeWhitespace: false, disableCombineTextItems: false })
      .then((textContent) => {
        let lastY;
        let text = "";
        for (const item of textContent.items) {
          if (lastY === item.transform[5] || lastY === undefined) {
            text += item.str;
          } else {
            text += "\n" + item.str;
          }
          lastY = item.transform[5];
        }
        pages.push(text);
        return text;
      });
  };

  const data = await pdf(buffer, { pagerender: renderPage });
  return { pages, numPages: data.numpages, fullText: data.text };
}

/**
 * Split a single page of text into overlapping chunks. Tries to break on
 * paragraph / sentence boundaries before falling back to a hard character cut.
 * @param {string} text
 * @returns {string[]}
 */
function splitText(text) {
  const clean = text.replace(/\s+\n/g, "\n").replace(/[ \t]{2,}/g, " ").trim();
  if (!clean) return [];
  if (clean.length <= CHUNK_SIZE) return [clean];

  const chunks = [];
  let start = 0;

  while (start < clean.length) {
    let end = Math.min(start + CHUNK_SIZE, clean.length);

    if (end < clean.length) {
      // Prefer to cut on a paragraph/sentence/word boundary near the end.
      const slice = clean.slice(start, end);
      const breakAt = Math.max(
        slice.lastIndexOf("\n\n"),
        slice.lastIndexOf(". "),
        slice.lastIndexOf("\n"),
        slice.lastIndexOf(" ")
      );
      if (breakAt > CHUNK_SIZE * 0.5) {
        end = start + breakAt + 1;
      }
    }

    const chunk = clean.slice(start, end).trim();
    if (chunk) chunks.push(chunk);

    if (end >= clean.length) break;
    start = end - CHUNK_OVERLAP;
    if (start < 0) start = 0;
  }

  return chunks;
}

/**
 * Parse a PDF buffer into an ordered list of text chunks with page numbers.
 * @param {Buffer} buffer
 * @returns {Promise<{ chunks: { text: string, page: number }[], numPages: number }>}
 */
async function chunkPdf(buffer) {
  const { pages, numPages } = await extractPages(buffer);
  const chunks = [];

  pages.forEach((pageText, pageIndex) => {
    for (const text of splitText(pageText)) {
      chunks.push({ text, page: pageIndex + 1 });
    }
  });

  return { chunks, numPages };
}

module.exports = { chunkPdf, extractPages, splitText, CHUNK_SIZE, CHUNK_OVERLAP };
