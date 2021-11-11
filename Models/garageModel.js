const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const garageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'There must be a garage name']
    },
    listOfImages: {
      type: Array,
      required: [true, 'there must be a garage Images']
    },
    location: String,
    ownerUserId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    worker: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        unique: true,
        sparse: true
      }
    ],
    published: {
      type: Boolean,
      default: false
    },
    GeragePassword: {
      type: String,
      minlength: 6
    },
    createdAt: Date
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
garageSchema.index({ name: 1 });
garageSchema.index({ worker: 1, ownerUserId: 1 }, { unique: true });
garageSchema.index({ ownerUserId: 1 }, { unique: true });

garageSchema.pre('save', async function(next) {
  this.GeragePassword = await bcrypt.hash(this.GeragePassword, 12);
  next();
});

/*
garageSchema.pre(/^find/, function(next) {
  this.find({ published: { $ne: false } });
  next();
});
*/
garageSchema.pre('save', async function(next) {
  this.createdAt = Date.now();
  next();
});

garageSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'ownerUserId',
    select:
      '-__v -passwordChangedAt -indexChecker -PasswordResetToken -PasswordResetExpires -active -isGarage'
  });
  next();
});
garageSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'worker',
    select:
      '-__v -passwordChangedAt -indexChecker -PasswordResetToken -PasswordResetExpires -active -isGarage'
  });
  next();
});

garageSchema.methods.garagechecker = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};
const garage = mongoose.model('garage', garageSchema);
module.exports = garage;
