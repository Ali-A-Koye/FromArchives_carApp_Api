const multer = require('multer');
const sharp = require('sharp');
const AppError = require('./../utils/error');
const catchAsync = require('../utils/CatchAsync');
const User = require('../Models/UserModel');
const factory = require('./HandlerFactory');
const cars = require('.//..//Models//carsModel');
const garage = require('.//..//Models//garageModel');
const favs = require('.//..//Models//favoritesModel');

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please Upload Only Images', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeuserPhoto = (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
};

const FilterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not defined! please use sign up instead'
  });
};
exports.getUser = factory.getOne(User);

exports.updateMe = catchAsync(async (req, res, next) => {
  //1)create error if user posts password data
  if (req.body.Password || req.body.PasswordConfirm)
    return next(
      new AppError(
        'this Route is not for Password Updates . please Change Password Route!',
        400
      )
    );

  const FilteredBody = FilterObj(
    req.body,
    'name',
    'Email',
    'phone',
    'active',
    'isGarage'
  );

  if (req.file) FilteredBody.photo = req.file.filename;

  const updatedUser = await User.findByIdAndUpdate(req.user.id, FilteredBody, {
    new: true,
    runValidators: true
  });
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await cars.deleteMany({ PostOwner: req.user.id }); ///Deleting all personal Posts
  await favs.deleteMany({ userid: req.user.id }); //Deleting All the Favs

  let garagefound;
  garagefound = await garage.find({
    ownerUserId: req.user._id
  });

  if (garagefound.length !== 0) {
    await cars.deleteMany({ garageId: garagefound[0]._id });
    await garage.findByIdAndUpdate(garagefound[0]._id, {
      published: false,
      worker: []
    });
  } else {
    garagefound = await garage.find({
      worker: req.user._id
    });
  }
  if (garagefound.length !== 0) {
    const EmailArray = [];
    garagefound[0].worker.forEach(el => {
      EmailArray.push(el._id);
    });
    const indextodelete = EmailArray.indexOf(req.user._id);
    EmailArray.splice(indextodelete, 1);
    await garage.findByIdAndUpdate(garagefound[0]._id, {
      worker: EmailArray
    });
  }

  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(200).json({
    status: 'success',
    data: 'User Successfully deleted!'
  });
});

exports.getAllUsers = factory.getAll(User);
//DO NOT UPDATE PASSWORDS WITH THIS
exports.UpdateUser = factory.UpdateOne(User);
exports.deleteUser = factory.deleteOne(User);
