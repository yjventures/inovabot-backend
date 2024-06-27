const mongoose = require("mongoose");

const addressSchema = mongoose.Schema(
  {
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: 'User',
    },
    address: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    state: {
      type: String,
      default: '',
    },
    country: {
      type: String,
      default: '',
    },
    post_code: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Address = mongoose.model("Address", addressSchema);
module.exports = Address;
