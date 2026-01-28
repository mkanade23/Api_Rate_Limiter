const mongoose = require("mongoose");

const rateLimitSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true
    },
    minute: {
      type: Number,// epoch minute
      required: true
    },
    count: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

rateLimitSchema.index({ userId: 1, minute: 1 }, { unique: true });

module.exports = mongoose.model("RateLimit", rateLimitSchema);
