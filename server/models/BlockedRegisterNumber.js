const mongoose = require('mongoose');

const blockedSchema = new mongoose.Schema(
  {
    registerNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    reason: {
      type: String,
      trim: true,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
  },
  { timestamps: true, versionKey: false }
);

blockedSchema.index({ registerNumber: 1 }, { unique: true });

const BlockedRegisterNumber = mongoose.model('BlockedRegisterNumber', blockedSchema);

module.exports = BlockedRegisterNumber;
