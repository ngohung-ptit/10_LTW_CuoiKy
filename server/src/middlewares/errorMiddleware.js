export const errorHandler = (err, req, res, next) => {
  console.error(err);

  const status = err.status || 500;
  const message = err.message || "Đã xảy ra lỗi máy chủ nội bộ.";

  res.status(status).json({
    error: message,
    ...(err.details && { details: err.details }),
  });
};

