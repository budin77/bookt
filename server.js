const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE_CONNECTION.replace(
  '<NAME>',
  process.env.DATABASE_NAME
)
  .replace('<PASSWORD>', process.env.DATABASE_PASSWORD)
  .replace('<USERNAME>', process.env.DATABASE_USERNAME);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('DB connection successful!'));

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

//subscribe for the unhandledRejection event - handle all the error in async code
process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('UNHANDLER REJECTION! Shutting down...');
  //close server first to finish the requests still pending or handled at the time
  server.close(() => {
    //shutdown app: 0 = sucess, 1 = uncaught exception
    process.exit(1);
  });
});

//subscribe for SIGTERM event - horoku specific- event is emitted from time to time(dynos restart every 24 hours)
//gracefully close the server
process.on('SIGTERM', () => {
  console.log('SIGTERM received.');
  server.close(() => {
    console.log('Process terminated!');
  });
});
