const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || 'INTERNAL_ERROR';
  
  // In lỗi ra terminal để dễ fix bug
  console.error('🚨 Bắt được lỗi:', err.message);

  res.status(statusCode).json({
    error: {
      code: errorCode,
      message: err.message || 'Lỗi hệ thống nội bộ',
      field: err.field || null
    }
  });
};

module.exports = errorHandler;