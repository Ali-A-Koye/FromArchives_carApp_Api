/* eslint-disable */

const catchAsync = require('../utils/CatchAsync');
const factory = require('./HandlerFactory');
const chat = require('.//..//Models//chatModel');
const chatholder = require('.//..//Models//ChatHolder');
const io = require('./../socket');

const AppError = require('../utils/error');

exports.Createchat = factory.CreateOne(chat);

exports.getAllchats = catchAsync(async (req, res, next) => {
  let limit = 10;

  if (req.query.limit) limit = req.query.limit;
  const doc = await chat
    .find({
      $or: [
        { Sender: req.UserDetails._id, Reciver: req.params.id },
        { Reciver: req.UserDetails._id, Sender: req.params.id }
      ]
    })
    .sort([['createdAt', -1]])
    .limit(limit);

  res.status(200).json({
    status: 'success',
    result: doc.length,
    messages: doc
  });
});
//{ Sender: req.UserDetails._id }, { Reciver: 1, lastDate: 1 })
exports.ShowLatest = catchAsync(async (req, res, next) => {
  let limit = 10;
  if (req.query.limit) limit = req.query.limit;
  const doc = await chatholder
    .find(
      {
        $or: [{ Sender: req.UserDetails._id }, { Reciver: req.UserDetails._id }]
      },
      { Sender: 1, Reciver: 1, lastDate: 1, channelId: 1 }
    )
    .sort([['lastDate', -1]])
    .limit(limit);

  res.status(200).json({
    status: 'success',
    result: doc.length,
    data: doc
  });
});
exports.BeforeCreate = catchAsync(async (req, res, next) => {
  req.body.Sender = req.UserDetails._id;
  req.body.Reciver = req.params.id;
  const doc = await chat
    .find(
      {
        $or: [
          { Sender: req.UserDetails._id, Reciver: req.params.id },
          { Reciver: req.UserDetails._id, Sender: req.params.id }
        ]
      },
      { id: 1 }
    )
    .limit(2);

  if (doc.length === 0) {
    await chatholder.create({
      Sender: req.UserDetails._id,
      Reciver: req.params.id,
      lastDate: Date.now()
    });
  } else {
    const target = await chatholder.find({
      $or: [
        { Sender: req.UserDetails._id, Reciver: req.params.id },
        { Reciver: req.UserDetails._id, Sender: req.params.id }
      ]
    });
    await chatholder.findByIdAndUpdate(target[0].id, {
      lastDate: Date.now()
    });
  }

  next();
});
