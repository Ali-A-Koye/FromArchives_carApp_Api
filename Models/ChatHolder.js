const mongoose = require('mongoose');

const chatHolderSchema = new mongoose.Schema(
  {
    Sender: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    Reciver: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    channelId: {
      type: String,
      unique: true
    },
    lastDate: Date, //recieve always Data.Now()
    createdAt: Date
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

chatHolderSchema.index({ Sender: 1, Reciver: 1 });

chatHolderSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'Reciver',
    select: 'name photo'
  });
  next();
});
chatHolderSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'Sender',
    select: 'name photo'
  });
  next();
});

chatHolderSchema.pre('save', async function(next) {
  this.createdAt = Date.now();
  next();
});

chatHolderSchema.pre('save', async function(next) {
  this.channelId = `${Math.floor(Math.random() * 10000 + 1)}${Date.now()}`;
  next();
});
const chat = mongoose.model('chatHolder', chatHolderSchema);
module.exports = chat;
