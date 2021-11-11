//tebenya kan hamw la TourRoutes.JS nwsrawa !! :)
const express = require('express');
const ExpressBrute = require('express-brute');
const AppError = require('./../utils/error');

const failCallback = function(req, res, next, nextValidRequestDate) {
  return next(new AppError('to Much Log In,Please Try Again Later!', 404));
};
const store = new ExpressBrute.MemoryStore(); // stores state locally, don't use this in production
const bruteforce = new ExpressBrute(store, {
  freeRetries: 5,
  minWait: 5 * 60 * 1000,
  maxWait: 60 * 60 * 1000,
  failCallback: failCallback
});

const Router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/aythController');

//Logging in and signing Up
Router.post('/signup', authController.signup);
Router.post('/login', bruteforce.prevent, authController.login);
Router.get('/logout', authController.logout);

//2 routes. You get a token from(forget password), use it in Reset password
Router.post('/forgotPassword', authController.forgotPassword);
Router.patch('/resetPassword/:token', authController.resetPassword);

//YOU SHOUDL BE LOGGED IN
Router.use(authController.protect);

//Router.get('/me', userController.getMe, userController.getUser);
//..................change Email and pass and name...............
//change Password for logged in user
Router.patch('/updateMyPassword', authController.updatePassword);
//Update email or name ( but not password) for logged in users
Router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeuserPhoto,
  userController.updateMe
);
//.........................................................................
//delete current User for logged in users
Router.delete('/deleteMe', userController.deleteMe);

Router.use(authController.restrictTo('admin'));
Router.route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
Router.route('/:id')
  .get(userController.getUser)
  .patch(userController.UpdateUser)
  .delete(userController.deleteUser);

module.exports = Router;
