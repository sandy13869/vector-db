const multer = require("multer");

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

// Keep the file in memory so it can be parsed/embedded without touching disk.
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const isPdf =
      file.mimetype === "application/pdf" ||
      file.originalname.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  }
});

// Wrap multer's single-file handler so its errors become clean JSON 400s.
const uploadPdf = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "File too large. Maximum allowed size is 50 MB."
          : err.message;
      return res.status(400).json({ success: false, error: { message } });
    }
    next();
  });
};

module.exports = { uploadPdf, MAX_FILE_SIZE };
