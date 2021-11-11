const express = require('express');
const io = require('./../socket');

const Router = express.Router({
  mergeParams: true
});

const newController = require('../controllers/chatController');
const authController = require('../controllers/aythController');

/*    authController.protect,
    authController.restrictTo('admin'),*/

Router.route('/latest').get(authController.protect, newController.ShowLatest);

Router.route('/test/:id').get((req, res, next) => {
  io.getIO().on('connection', function(socket) {
    socket.join(req.params.id);
  });

  io.getIO()
    .to(req.params.id)
    .emit('user-Connected', { data: 'i am emited' });

  res.end();
});

Router.route('/:id')
  .get(authController.protect, newController.getAllchats)
  .post(
    authController.protect,
    newController.BeforeCreate,
    newController.Createchat
  );

/*Router.route('/:id')
  .get(newController.getUser)
  .patch(newController.UpdateUser)
  .delete(newController.deleteUser); */
module.exports = Router;
