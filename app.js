//.............TOP LEVEL CODE................
const bodyParser = require('body-parser');
const path = require('path');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');

const compression = require('compression');
const hpp = require('hpp');
const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/error');

//Start Express App
const app = express();
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

//
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
//
const userRouter = require('./Routes/userRoutes');
const carsRouter = require('./Routes/carsRoute');
const garageRouter = require('./Routes/garageRoute');
const favoritesRouter = require('./Routes/favoritesRoute');
const chatRouter = require('./Routes/chatRoute');

app.use(
  express.json({
    limit: '10kb'
  })
);
app.use(cookieParser());
//

//
app.use(mongoSanitize());
app.use(xss());
app.use(
  hpp({
    whitelist: ['name', 'newsBrief', 'newsbody', 'NPictures', 'Postbrief']
  })
);

app.use(compression());
app.use(express.static(`${__dirname}/public`));
app.use(helmet());
const limiter = rateLimit({
  max: 500,
  windowMs: 60 * 60 * 1000,
  message: 'too Many requests from this IP , please try again in one hours'
});
app.use('/api', limiter);
//
//
//
//
app.use('/api/users', userRouter);
app.use('/api/cars', carsRouter);
app.use('/api/garage', garageRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/chat', chatRouter);

//RENDERING THE PAGE
app.use('/resetPassword/:token', function(req, res, next) {
  res.status(200).render('resetpass', {
    title: 'Single'
  });
});

//events--------

//-------------
app.all('*', (req, res, next) => {
  next(new AppError(`Cant find ${req.originalUrl} on the API`, 404));
  /* if (req.url.includes('/en/')) next(new AppError(`Page Not Found`, 404));
  else if (req.url.includes('/ar/'))
    next(new AppError(`الصفحة غير موجودة`, 404));
  else next(new AppError(`ببورە ئەم لینكە نەدۆزرایەوە`, 404)); */
});

app.use(globalErrorHandler);

module.exports = app;
