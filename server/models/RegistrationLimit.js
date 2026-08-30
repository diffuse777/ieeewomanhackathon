const mongoose = require('mongoose');

const registrationLimitSchema = new mongoose.Schema(
  {
    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
      type: Date,
      required: true,
    },
    limit: {
      type: Number,
      required: true,
      min: [0, 'limit must be non-negative'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const RegistrationLimit = mongoose.model('RegistrationLimit', registrationLimitSchema);

module.exports = RegistrationLimit;
