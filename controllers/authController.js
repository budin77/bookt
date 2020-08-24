const crypto = require('crypto'); //build-in node module
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    //only read and send
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    //HTTPS only
    cookieOptions.secure = true;
    cookieOptions.SameSite = 'none';
  }

  // if (req.secure || req.headers('x-forwarded-proto') === 'https') {
  //   cookieOptions.secure = true;
  // }

  res.cookie('jwt', token, cookieOptions);

  const newUser = user.toObject();
  delete newUser.password;
  delete newUser.__v;

  res.status(statusCode).json({
    status: 'success',
    token,
    expiresIn: process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60,
    data: {
      user: newUser
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const currentUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role
  });

  createSendToken(currentUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide the email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.passwordIsCorrect(password, user.password))) {
    // const error = new AppError('Invalid email or password', 401);
    // console.log(error);
    return next(new AppError('Invalid email or password', 401));
  }

  createSendToken(user, 200, req, res);
});

exports.logout = (req, res, next) => {
  const cookieOptions = {
    expires: new Date(Date.now() + 10 * 1000),
    //only read and send
    httpOnly: true
  };

  //optional -  no need
  if (process.env.NODE_ENV === 'production') {
    //HTTPS only
    cookieOptions.secure = true;
  }

  res.cookie('jwt', 'logout', cookieOptions);

  res.status(200).json({ status: 'success' });
};

//API Authentification
exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // 1) check if token exist in HTTP headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    //read token from cookies
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please login to get access', 401)
    );
  }

  // 2) check if it is a valid token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) check if the user still exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user no longer exist!', 401));
  }

  // 4) check if the user changed the password after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('The user changed password! Please log in again', 401)
    );
  }
  res.locals.user = currentUser;
  req.user = currentUser;
  next();
});

//used only for SSR
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) check if it is a valid token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) check if the user still exist
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) check if the user changed the password after token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      //pug has access to locals
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

//Authorization
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles is an array - spread operator
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};

//Password forgot & reset
exports.forgetPassword = catchAsync(async (req, res, next) => {
  //1) get user based on the email

  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('No user with the  email address!'), 404);
  }

  //2) generate reset token
  const resetToken = user.createTokenResetPassword();

  await user.save({ validateBeforeSave: false }); //deactivate validation on save

  //3) compose && send an email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a pach request to ${resetURL}`;

  try {
    await sendEmail({
      email: user.email,
      subject: ' Your password reset token!',
      message: message
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new AppError('Error sending the email', 500));
  }

  res.status(200).json({
    status: 'success',
    message: 'Token sent to email!'
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on token and token expiration
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('Token is invalid or expired!', 400));
  }

  //2) If token valid and not expired, and the user exist, set the new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;
  await user.save();

  //3) Update changedPasswordAt property for the user
  //user.updateChangedPasswordAt();
  //await user.save({ validateBeforeSave: false });

  //4) Log the user in = !means send JWT

  createSendToken(user, 200, req, res);
});

//only the for login users
exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) GET the user from database
  const user = await User.findById(req.user.id).select('+password');

  //2) Posted password is correct
  if (
    !(await user.passwordIsCorrect(req.body.passwordCurrent, user.password))
  ) {
    return next(new AppError('Your current password is incorrect!', 401));
  }

  //3) Update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //User.updateByIdAndUpdate will not work for password update because we are using hooks and also validation from schema not workink

  //4) Login the user again - send jwt
  createSendToken(user, 201, req, res);
});
