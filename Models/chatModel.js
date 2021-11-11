const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    Sender: mongoose.Schema.ObjectId,
    Reciver: mongoose.Schema.ObjectId,
    message: {
      type: String,
      trim: true
    },
    createdAt: Date
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
chatSchema.index({ Sender: 1, Reciver: 1 });

/*
chatSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'Reciver',
    select: 'name photo'
  });
  next();
}); */
chatSchema.pre('save', async function(next) {
  this.createdAt = Date.now();
  next();
});
const chat = mongoose.model('chat', chatSchema);
module.exports = chat;
