class ApiError extends Error {
  constructor(statusCode, errorCode, message, field = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.field = field;
  }
}
module.exports = ApiError;