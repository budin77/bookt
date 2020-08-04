const crypto = require('crypto'); //build-in node module
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please insert the name!']
  },
  email: {
    type: String,
    required: [true, 'Please insert the email!'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please insert a valid email!']
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: true,
    select: false,
    minlength: 8
  },
  passwordConfirm: {
    type: String,
    required: true,
    validate: {
      //This is work only on CREATE or SAVE !!!
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

// hook/middleware password encryption
userSchema.pre('save', async function(next) {
  //Only run if password is modified
  if (!this.isModified('password')) return next();

  //Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  //Delete the passwordConfirm field(to not be persistent)
  this.passwordConfirm = undefined;

  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//middleware
userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

//instance method : available on all documents(instances of Model)
userSchema.methods.passwordIsCorrect = async (textPassword, hashPassword) => {
  return await bcrypt.compare(textPassword, hashPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

userSchema.methods.createTokenResetPassword = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

/*
userSchema.methods.updateChangedPasswordAt = function() {
  this.updateChangedPasswordAt = Date.now();
};
/
*/
const User = mongoose.model('User', userSchema);

module.exports = User;
