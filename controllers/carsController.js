const bcrypt = require('bcryptjs');
const axios = require('axios').default;
const catchAsync = require('../utils/CatchAsync');
const factory = require('./HandlerFactory');
const cars = require('.//..//Models//carsModel');
const garage = require('.//..//Models//garageModel');
const AppError = require('../utils/error');
const APIFeatures = require('./../utils/apiFeatures');

//----------------------------------------------------------------

exports.timeQuery = catchAsync(async (req, res, next) => {
  let filter = {};
  if (!req.query.time)
    return next(
      new AppError('You Cant Use this Route without Providing Time!', 400)
    );
  filter.createdAt = { $gte: req.query.time };
  if (req.query.carType) filter.carType = req.query.carType;

  console.log(filter);
  const doc = await cars.find(filter).sort([['createdAt', -1]]);

  // const doc = await features.query.explain();

  res.status(200).json({
    status: 'success',
    length: doc.length,
    user: doc
  });
});
//----------------------------------------------------------------

exports.getAllCars = factory.getAll(cars);
exports.getCar = factory.getOne(cars);
exports.CreateCar = factory.CreateOne(cars);
exports.UpdateCar = factory.UpdateOne(cars);
exports.DeleteCar = factory.deleteOne(cars);
exports.SearchMovies = factory.PartialSearch(cars);

exports.Check = catchAsync(async (req, res, next) => {
  //check the properties
  if (req.body.individual === 'true') {
    req.body.individual = true;
  }
  if (req.body.individual === 'false') {
    req.body.individual = false;
  }

  if (req.UserDetails.isGarage === true && req.body.individual === false) {
    //looking for the garage in two queries
    let garagefound;
    garagefound = await garage.find({
      worker: req.UserDetails._id
    });
    if (garagefound.length === 0) {
      garagefound = await garage.find({
        ownerUserId: req.UserDetails._id
      });
    }
    if (garagefound.length === 0)
      return next(new AppError('No Gerage found for this user!', 403));

    //Now we have the result , lets check for the garage password
    if (!req.body.garagePassword)
      return next(new AppError('user Should Provide Password!', 403));
    const result = await bcrypt.compare(
      req.body.garagePassword,
      garagefound[0].GeragePassword
    );

    if (!result) {
      return next(new AppError('Garage Password is wrong!', 403));
    }
    //if everything is alr1ight , then add this property to the Body
    req.body.garageId = garagefound[0].id;
  }
  next();
});

exports.CarsPermission = catchAsync(async (req, res, next) => {
  if (!req.params.id) next(new AppError('Wrong Url', 400));

  const itemfound = await cars.find({ _id: req.params.id });

  if (!itemfound) next(new AppError('No Posts were Found', 403));
  const user = req.UserDetails.id;
  if (user.localeCompare(itemfound[0].PostOwner._id) === 0) {
    next();
  } else if (req.UserDetails.isGarage === true) {
    //
    const garagefound = await garage.find({
      ownerUserId: req.UserDetails._id
    });

    //
    if (user.localeCompare(garagefound[0].ownerUserId._id) === 0) {
      next();
    } else {
      next(new AppError('You Dont Have Permission to do this Action!', 403));
    }
  } else {
    next(new AppError('You Dont Have Permission to do this Action!', 403));
  }
});
