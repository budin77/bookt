const mongoose = require('mongoose');
const Tour = require('./tourModel');
//const catchAsync = require('./../utils/catchAsync');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!']
    },
    rating: {
      type: Number,
      required: [true, 'Review must have a rating!'],
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must have a tour assigned']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must have an user assigned']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

//Query middleware (Hook) - popoulate with user info
reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name photo'
  });

  next();
});

//start calcAverageRatings on tour
//static method on Schema
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].nRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 4.5,
      ratingsQuantity: 0
    });
  }
};

reviewSchema.post('save', async function() {
  //this = document
  await this.constructor.calcAverageRatings(this.tour);
});

//for update and delete we used: findByIdAndUpdate,findByIdAndDelete
//behind the scene the findByIdAndUpdate it is a  shorthand for findOneAndUpdate
//behind the scene the findByIdAndDelete it is a  shorthand for findOneAndDelete
//for findByIdAndUpdate,findByIdAndDelete we have only query hooks
reviewSchema.pre(/^findOneAnd/, async function(next) {
  //this = query
  this.reviewDoc = await this.findOne();
  next();
});
reviewSchema.post(/^findOneAnd/, async function() {
  //this = query
  //await this.findOne(); nor work here because the quesry was already executed
  this.reviewDoc.constructor.calcAverageRatings(this.reviewDoc.tour);
});
//end calcAverageRatings on tour

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
