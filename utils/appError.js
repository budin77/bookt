module.exports = class extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    //location in the code at which Error.captureStackTrace() was called.
    Error.captureStackTrace(this, this.constructor);
  }
};
