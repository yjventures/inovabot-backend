const mongoose = require("mongoose");
const tempPasswordSchema = new mongoose.Schema(
  {
    email: {
      type: String,
    },
    password: {
      type: String,
    },
    status: {
      type: Number,
      default: 0,
    },
    createdDate: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    versionKey: false,
  }
);

const tempPasswordModel = mongoose.model("temp_password", tempPasswordSchema);
module.exports = tempPasswordModel;
