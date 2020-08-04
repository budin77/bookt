const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// ROUTES HANDLERS
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  //1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for update password. Please use /updateMyPassword',
        400
      )
    );
  }

  //2) filter req.body(i.e not update the role)
  const filteredBody = filterObj(req.body, 'name', 'email');

  //3) Update user document
  //option new: true - return the new updated object
  const updatedUser = await User.findOneAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  //4) Send 200 response
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.createUser = catchAsync(async (req, res, next) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup !'
  });
});

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
//To not update the password
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
