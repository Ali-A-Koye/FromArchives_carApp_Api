const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../Models/UserModel');
const catchAsync = require('../utils/CatchAsync');
const AppError = require('./../utils/error');
const Email = require('./../utils/email');

const signtoken = id => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};
const createSendToken = (user, statusCode, res) => {
  const token = signtoken(user._id);
  const cookieOption = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'produuction') {
    cookieOption.secure = true;
  }
  res.cookie('jwt', token, cookieOption);

  //remove password From output
  user.Password = undefined;
  res.status(statusCode).json({
    status: 'success',
    data: {
      token
    }
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  req.body.role = 'user';
  const newUser = await User.create(req.body);
  //const url = `${req.protocol}://${req.get('host')}/changeinfo`;
  //await new Email(newUser, url).sendWelcome();
  await createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const email = req.body.Email;
  const password = req.body.Password;
  //1) if email and pass exist
  if (!email || !password) {
    return next(
      new AppError('Please fill both Email and Password Fields', 400)
    );
  }
  //2) check if user exist && password is correct (search within the database)
  const user = await User.findOne({ Email: email }).select('+Password');
  if (!user || !(await user.correctPassword(password, user.Password))) {
    return next(new AppError('Incorrect Email or Password', 401));
  }
  //3) if everything ok , send the token to
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'logged out', {
    expires: new Date(Date.now + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(new AppError('Error occurred: you are not authenticated', 401));
  }
  //2) verfication the signtoken
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //3) check if user still exist
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError('the token Belong to this user does not exist', 401)
    );
  }
  //4)check if user changed password after the token was issues

  if (freshUser.ChangedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User Recently changed Password , Please Login again', 401)
    );
  }
  //grant access to protected routes
  freshUser.indexChecker = undefined;
  req.user = freshUser;
  res.locals.user = freshUser;
  req.UserDetails = freshUser;

  next();
});

//Only for rendered pages , No Errors~
exports.isLoggedIn = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (token) {
      //verify the token
      const decoded = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET
      );
      //2) check if user still exist
      const freshUser = await User.findById(decoded.id);
      if (!freshUser) {
        return next();
      }
      //4)check if user changed password after the token was issues
      if (freshUser.ChangedPasswordAfter(decoded.iat)) {
        return next();
      }
      //there is a Logged in User
      res.locals.user = freshUser;
      req.UserDetails = freshUser;
    }
  } catch (err) {
    return next();
  }

  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("you don't have permission to do this Action", 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1)get user based on posted Email
  const user = await User.findOne({ Email: req.body.Email });

  if (!user) {
    return next(
      new AppError("We couldn't find any User with that Email Address", 404)
    );
  }
  //2)genarate random reset signtoken
  const resetToken = user.ChangedPasswordResetToken();

  await user.save({
    validateBeforeSave: false
  });

  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'token sent to email'
    });
  } catch (err) {
    user.ChangedPasswordResetToken = undefined;
    user.PasswordResetExpires = undefined;
    await user.save({
      validateBeforeSave: false
    });
    return next(new AppError('there was an error sending the email', 500));
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1)get user based on the signtoke
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    PasswordResetToken: hashedToken,
    PasswordResetExpires: { $gt: Date.now() }
  });

  //2)if token had not expired and there is user , set the new passwordResetExpires
  if (!user) {
    return next(new AppError('token is Invalid or has expired', 400));
  }
  user.Password = req.body.password;
  user.PasswordConfirm = req.body.passwordConfirm;
  user.PasswordResetToken = undefined;
  user.PasswordResetExpires = undefined;
  await user.save();
  //3) update changedPasswordAt property for the users

  //4)log the user in
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1)get user from collection
  const user = await User.findById(req.user.id).select('+Password');
  if (!user) {
    return next(new AppError('There is no user with that email address', 404));
  }
  //2)check if posted password is correctPassword

  if (!(await user.correctPassword(req.body.passwordCurrent, user.Password))) {
    return next(new AppError('Your Current Password is wrong', 401));
  }

  //3) if so , update the password
  user.Password = req.body.Password;
  user.PasswordConfirm = req.body.PasswordConfirm;
  await user.save();
  //User.FindByIDandUpdate will not work as intended!
  //4) log in user
  //4)log the user in
  createSendToken(user, 200, res);
});
