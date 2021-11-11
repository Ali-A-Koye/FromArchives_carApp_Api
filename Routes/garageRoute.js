const express = require('express');

const Router = express.Router({
  mergeParams: true
});

const newController = require('../controllers/gerageController');
const authController = require('../controllers/aythController');
const imageHandler = require('../controllers/imageHandler');

Router.route('/l').get(authController.protect, newController.SearchGarage); //http://127.0.0.1:3000/garage/l?search=a

Router.route('/')
  .get(
    authController.protect,
    newController.getAllChecker,
    newController.getAllGarage
  )
  .post(
    authController.protect,
    imageHandler.uploadImages,
    newController.setUserEmail,
    newController.EmailsChecker,
    imageHandler.resizePhotos('Garage'),
    newController.CreateGarage
  );

Router.route('/:id')
  .get(
    authController.protect,
    newController.getAllChecker,
    newController.getGarage
  )
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'adminGarage'),
    newController.CheckerDeleteUpdate,
    imageHandler.uploadImages,
    newController.UpdateCheker,
    newController.UpdateWorker,
    imageHandler.resizePhotos('Garage'),
    newController.UpdateGarage
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'adminGarage'),
    newController.CheckerDeleteUpdate,
    newController.deleteChecker,
    newController.DeleteGarage
  );

module.exports = Router;
