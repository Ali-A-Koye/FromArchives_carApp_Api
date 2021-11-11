/* eslint-disable */
const axios = require('axios').default;
const factory = require('./HandlerFactory');
const garage = require('.//..//Models//garageModel');
const User = require('../Models/UserModel');
const AppError = require('../utils/error');
const catchAsync = require('../utils/CatchAsync');

//----------------------------------------------------------------
//----------------------------------------------------------------

exports.getAllGarage = factory.getAll(garage);
exports.getGarage = factory.getOne(garage);
exports.CreateGarage = factory.CreateOne(garage);
exports.UpdateGarage = factory.UpdateOne(garage);
exports.DeleteGarage = factory.deleteOne(garage);
exports.SearchGarage = factory.PartialSearch(garage);

exports.CheckerDeleteUpdate = catchAsync(async (req, res, next) => {
  if (req.UserDetails.role !== 'admin') {
    const garagefound = await garage.findById(req.params.id);
    const user = req.UserDetails.id;
    if (user.toString().localeCompare(garagefound.ownerUserId._id) === 0) {
      next();
    } else {
      next(new AppError('You Dont Have Permission to do this Action!', 403));
    }
  } else {
    next();
  }
});

exports.getAllChecker = (req, res, next) => {
  if (req.user.role !== 'admin') req.query.published = true;
  next();
};

exports.setUserEmail = catchAsync(async (req, res, next) => {
  if (req.body.ownerEmail) {
    const userfound = await User.find({ Email: req.body.ownerEmail });
    const workers = [];

    if (userfound) {
      req.body.ownerUserId = userfound[0].id;
      if (req.body.reqEmails !== '' && req.body.reqEmails !== undefined)
        req.body.workerEmail = req.body.reqEmails.split(',');
      else req.body.reqEmails = [];
      if (req.body.workerEmail && req.body.workerEmail.length !== 0) {
        for (const file of req.body.workerEmail) {
          const workerfound = await User.find({ Email: file });
          workers.push(workerfound[0].id);
        }
      }

      req.body.worker = workers;
    }
  } else {
    return next(new AppError('Cannot find Owner email!', 403));
  }

  next();
});

exports.UpdateCheker = catchAsync(async (req, res, next) => {
  const garagefound = await garage.find({ _id: req.params.id });
  if (garagefound.length === 0)
    return next(new AppError('Garage Not Found!', 403));
  const users = garagefound[0].worker;

  const EmailArray = [];
  users.forEach(el => {
    EmailArray.push(el._id);
  });
  //sending it to next Middleware
  req.WorkerEmailsReq = [...EmailArray];
  EmailArray.push(garagefound[0].ownerUserId._id);

  //ONLY FOR ADMIN , CHANGING Published and IsGarage and adminGarage role

  if (req.body.published == true || req.body.published == false) {
    if (req.UserDetails.role === 'admin') {
      for (const file of EmailArray) {
        await User.findByIdAndUpdate(file, {
          isGarage: req.body.published
        });
      }
      let roleselected = req.body.published == true ? 'adminGarage' : 'user';

      await User.findByIdAndUpdate(garagefound[0].ownerUserId._id, {
        role: roleselected
      });
    } else {
      delete req.body.published;
    }
  }

  next();
});

exports.UpdateWorker = catchAsync(async (req, res, next) => {
  if (req.body.workerEmail) {
    if (req.body.workerEmail.startsWith('-')) {
      //PREPARING FOR DELETE
      const email = req.body.workerEmail.split(' ')[1];

      const userfound = await User.find({ Email: email });

      if (userfound.length === 0)
        return next(new AppError('No user found with this email address', 403));

      //USER FOUND ,Lets Check if He is in the WorkList Or Not

      if (!req.WorkerEmailsReq.toString().includes(userfound[0]._id))
        return next(
          new AppError('Provided email is not in the workers list', 403)
        );
      const indextodelete = req.WorkerEmailsReq.indexOf(userfound[0].id);

      req.WorkerEmailsReq.splice(indextodelete, 1);
      await User.findByIdAndUpdate(userfound[0].id, {
        indexChecker: false,
        isGarage: false
      });
      req.body.worker = [...req.WorkerEmailsReq];
    } else {
      //PREPARING FOR ADD
      const userfound = await User.find({ Email: req.body.workerEmail });

      if (userfound.length === 0)
        return next(new AppError('No user found with this email', 403));

      if (req.WorkerEmailsReq.toString().includes(userfound[0].id))
        return next(new AppError('User exists, Cannot add it again', 403));
      req.WorkerEmailsReq.push(userfound[0].id);
      await User.findByIdAndUpdate(userfound[0].id, {
        indexChecker: true,
        isGarage: true
      });
      req.body.worker = [...req.WorkerEmailsReq];
    }
  }

  next();
});

const cars = require('.//..//Models//carsModel');

exports.deleteChecker = catchAsync(async (req, res, next) => {
  const garagefound = await garage.findById(req.params.id, '-GeragePassword');

  if (!garagefound) next(new AppError('Garage not Found!', 400));

  await cars.updateMany(
    { garageId: garagefound.id },
    {
      available: false
    }
  );
  //
  //GRABBING Emails Again
  const users = garagefound.worker;
  const EmailArray = [];
  users.forEach(el => {
    EmailArray.push(el._id);
  });
  EmailArray.push(garagefound.ownerUserId._id);
  //

  for (const file of EmailArray) {
    await User.findByIdAndUpdate(file, {
      isGarage: false,
      indexChecker: false,
      role: 'user'
    });
  }
  next();
});

exports.EmailsChecker = catchAsync(async (req, res, next) => {
  const emails = req.body.worker;
  emails.push(req.body.ownerUserId);
  for (const email of emails) {
    let a = await User.findById(email, { indexChecker: 1 });
    if (a.indexChecker == true) {
      next(
        new AppError(
          `One of the workers or the Owner is found from Another Garage`,
          403
        )
      );
    }
  }

  for (const email of emails) {
    await User.findByIdAndUpdate(email, {
      isGarage: true,
      indexChecker: true
    });
  }
  next();
});
