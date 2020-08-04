const express = require('express');
const authController = require('./../controllers/authController');
const tourController = require('./../controllers/tourController');
// const reviewController = require('./../controllers/reviewController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

//A router behaves like middleware itself, so you can use it
//as an argument to app.use() or as the argument to another router’s use() method.
router.use('/:tourId/reviews', reviewRouter);

//middleware
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/monthly-plan/:year')
  .get(
    tourController.updateTour,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

router
  .route('/tours-near-me/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursNearMe);

//calculate the distances from a certain point to all tours start location
router
  .route('/tours-distances/:latlng/unit/:unit')
  .get(tourController.getToursDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    tourController.updateTour,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
