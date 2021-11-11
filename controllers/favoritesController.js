const catchAsync = require('../utils/CatchAsync');
const factory = require('./HandlerFactory');
const favs = require('.//..//Models//favoritesModel');
const AppError = require('../utils/error');

exports.getAllfavs = factory.getAll(favs);
exports.getfavs = factory.getOne(favs);
exports.Createfavs = factory.CreateOne(favs);
exports.Updatefavs = factory.UpdateOne(favs);
exports.Deletefavs = factory.deleteOne(favs);

exports.setUserPostid = catchAsync(async (req, res, next) => {
  req.body.userid = req.UserDetails._id;

  next();
});

exports.getAllfavsChecker = catchAsync(async (req, res, next) => {
  req.query.userid = req.UserDetails._id;
  next();
});

exports.deleteCheck = catchAsync(async (req, res, next) => {
  const doc = await favs.findById(req.params.id, 'userid');
  if (!doc) next(new AppError('Nothing Found to Delete!', 403));

  if (doc.userid.toString().localeCompare(req.UserDetails._id) === 0) {
    next();
  } else {
    next(new AppError('You Dont Have Permission to do this Action!', 403));
  }
});
