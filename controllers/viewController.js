const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getIndex = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();
  res.status(200).render('index', { title: 'All Tours', tours });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });

  if (!tour) {
    return next(new AppError('The tour not exist.', 404));
  }

  res.status(200).render('tour', { title: tour.name, tour });
});

exports.getLogin = (req, res) => {
  res.status(200).render('login', { title: 'Log into your account' });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', { title: 'My Account' });
};

exports.updateUserDate = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email
    },
    {
      new: true,
      runValidators: true
    }
  );

  res
    .status(200)
    .render('account', { title: 'My Account' }, { user: updatedUser });
});
