export const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV !== "test") {
    console.error(err);
  }

  if (err?.code === 11000) {
    return res.status(409).json({
      error: "Dữ liệu bị trùng khóa duy nhất trong cơ sở dữ liệu.",
    });
  }

  if (err?.name === "ValidationError") {
    const firstMessage = Object.values(err.errors || {})[0]?.message;
    return res.status(400).json({
      error: firstMessage || "Dữ liệu đầu vào không hợp lệ.",
    });
  }

  if (err?.name === "CastError") {
    return res.status(400).json({ error: "Định dạng tham số không hợp lệ." });
  }

  if (err?.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({ error: "Nội dung JSON gửi lên không hợp lệ." });
  }

  const status = Number.isInteger(err?.status) ? err.status : 500;
  if (status >= 500) {
    return res.status(status).json({
      error: "Đã xảy ra lỗi máy chủ nội bộ.",
    });
  }

  return res.status(status).json({
    error: err.message || "Yêu cầu không hợp lệ.",
    ...(err.details && { details: err.details }),
  });
};
