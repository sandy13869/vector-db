const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err.message);

  const isInvalidJson = err instanceof SyntaxError && err.status === 400 && "body" in err;
  const statusCode = isInvalidJson ? 400 : err.statusCode || err.status || 500;
  const message = isInvalidJson ? "Request body contains invalid JSON" : err.message || "Internal Server Error";

  if (res.headersSent) return next(err);

  res.status(statusCode).json({
    success: false,
    error: {
      message: message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    }
  });
};

module.exports = errorHandler;
