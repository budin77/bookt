const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views')); //set path to views folder

//GLOBAL MIDDLEWERE

//Cross Origin Resource Sharing
app.use(cors());
//Enabling CORS Pre-Flight
app.options('*', cors());

//Serving static files
app.use(express.static(path.join(__dirname, 'public')));

//Set security HTTP Headers
app.use(helmet());

//Development loggin
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Limit request fromsame IP
//max 100 requests from same IP per hour
const limiter = rateLimit({
  max: 100,
  windowMS: 60 * 60 * 1000,
  message: 'To many requestd from this IP, please try again in a hour!'
});

app.use('/api', limiter);

//Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
//Body parser, parse the forms params (URL Encoded form = the way the form is send data to the server)
app.use(
  express.urlencoded({
    extended: true,
    limit: '10kb'
  })
);
app.use(cookieParser());

//Data sanatization against NoSQL query injection
//look to the req.body,req.query and req.params and filter out $
app.use(mongoSanitize());

//Data sanatization  against XSS
//filter malicious HTML code with JS code, - convert all the HTML symbols to HTML entities
app.use(xss());

//Prevent parameter pollution - remove duplicate fields from query string
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

//compress all tehe texts that are send to the clients
app.use(compression());

//ROUTES

// SERVER SIDE REDERING - ROUTES
app.use('/', viewRouter);

//API - ROUTES - MIDDLEWERE FOR SPECIFIC URLs(RESOURCES)
//! A router behaves like middleware itself, so you can use it
//as an argument to app.use() or as the argument to another router’s use() method.
//Mounting a router
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

//404 page
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl}`, 404));
});

//GLOBAL MIDDLEWARE FOR OPERATIONAL ERRORS
app.use(globalErrorHandler);

module.exports = app;
