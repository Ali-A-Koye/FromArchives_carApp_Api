const multer = require('multer');
const sharp = require('sharp');
const AppError = require('./../utils/error');
const catchAsync = require('../utils/CatchAsync');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'ئەمەی ئەپڵۆد كراوە وێنە نیە،تكایە تەنها وێنە ئەپڵۆد كە',
        400
      ),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadImages = upload.array('listOfImages', 10);
exports.resizePhotos = path =>
  catchAsync(async (req, res, next) => {
    if (!req.files) return next();

    req.body.listOfImages = [];
    await Promise.all(
      req.files.map(async (file, i) => {
        const filename = `${path}-${Date.now()}-${i + 1}.jpeg`;

        await sharp(file.buffer)
          .toFormat('jpeg')
          .jpeg()
          .toFile(`public/img/${path}/${filename}`);

        req.body.listOfImages.push(filename);
      })
    );

    next();
  });

//================================================================
exports.SetSinglePhoto = (req, res, next) => {
  if (req.file) req.body.Photo = req.file.filename;

  next();
};
