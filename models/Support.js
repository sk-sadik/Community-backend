const mongoose = require('mongoose');

const SupportSchema = new mongoose.Schema(
  {
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Enforce unique support validation (one user can support one issue only)
SupportSchema.index({ issue: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Support', SupportSchema);
