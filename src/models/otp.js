const mongoose = require("mongoose");
const { otpStatus } = require("../utils/enums");

const otpSchema = mongoose.Schema(
  {
    email: {
      type: String,
    },
    type: {
      type: String,
    },
    otp: {
      type: String,
    },
    status: {
      type: Number,
      default: otpStatus.UNUSED,
    },
    createdDate: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    timestamps: true,
  }
);

const Otp = mongoose.model("Otp", otpSchema);
module.exports = Otp;
