const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User must have a Name']
  },
  Email: {
    type: String,
    required: [true, 'User Must have Email Address'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, '.please provide a valid Email Address']
  },
  role: {
    type: String,
    enum: ['admin', 'adminGarage', 'moderator', 'user'],
    default: 'user'
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  Password: {
    type: String,
    required: [true, 'User must have password'],
    minlength: 8,
    select: false
  },
  PasswordConfirm: {
    type: String,
    required: [true, '.User must Have PasswordConfirm'],
    validate: {
      validator: function(el) {
        return el === this.Password;
      },
      message: 'PasswordConfirm is not same as Password'
    }
  },
  phone: {
    type: String
  },
  isGarage: {
    type: Boolean,
    default: false
  },
  indexChecker: {
    type: Boolean,
    default: false
  },
  passwordChangedAt: Date,
  PasswordResetToken: String,
  PasswordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('Password')) return next();
  this.Password = await bcrypt.hash(this.Password, 12);
  this.PasswordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('Password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.ChangedPasswordAfter = function(JWTtimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTtimeStamp < changedTimeStamp;
  }

  return false;
};

userSchema.methods.ChangedPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.PasswordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.PasswordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
