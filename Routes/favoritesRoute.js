const express = require('express');

const Router = express.Router({
  mergeParams: true
});

const newController = require('../controllers/favoritesController');
const authController = require('../controllers/aythController');

/*    authController.protect,
    authController.restrictTo('admin'),*/
Router.route('/')
  .get(
    authController.protect,
    newController.getAllfavsChecker,
    newController.getAllfavs
  )
  .post(
    authController.protect,
    newController.setUserPostid,
    newController.Createfavs
  );

Router.route('/:id').delete(
  //CHECKKK
  authController.protect,
  newController.deleteCheck,
  newController.Deletefavs
);

module.exports = Router;
