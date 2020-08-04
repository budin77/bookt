const AppError = require('./../utils/appError');

//Mongoose castError handle
const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

//MongoDB duplicate fields handle
const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  const message = `Duplicate field value ${value} . Please use another value !`;
  return new AppError(message, 400);
};

//Mongoose validation error handle
const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 404);
};

const handleJsonWebTokenError = () =>
  new AppError('Invalid token! Please login again', 401);

const handleTokenExpiredError = () =>
  new AppError('Expired token! Please login again', 401);

const sendErrorDev = (err, req, res) => {
  //API
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      err: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    //RENDERING WEBSITE
    console.log('Error', err);
    res
      .status(err.statusCode)
      .render('error', { title: 'Something went wrong!', error: err.message });
  }
};

const sendErrorProd = (err, req, res) => {
  //A) API
  if (req.originalUrl.startsWith('/api')) {
    //Operational, trusted error
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
      //Programming or other unknown error, for 3rd packages
    }
    //1) Log error
    console.log('Error', err);
    //2) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    });
  }

  //B)RENDERING WEBSITE
  //Operational, trusted error
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      error: err.message
    });
    //Programming or other unknown error, for 3rd packages
  }
  //1) Log error
  console.log('Error', err);

  //2) Send generic message
  return res.status(500).render('error ', {
    title: 'Something went wrong!',
    error: 'Please try again later!'
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err }; //hard copy ?????
    error.message = err.message;

    //Mongoose CastError
    if (err.name === 'CastError') error = handleCastErrorDB(error);

    //MongoDB error(i.e duplicate fields value)
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);

    //Mongoose ValidationError
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);

    //JWT JsonWebTokenError
    if (err.name === 'JsonWebTokenError') error = handleJsonWebTokenError();

    //JWT TokenExpiredError;
    if (err.name === 'TokenExpiredError') error = handleTokenExpiredError();

    sendErrorProd(error, req, res);
  }
};
