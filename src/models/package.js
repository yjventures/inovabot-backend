const mongoose = require("mongoose");

const packageSchema = mongoose.Schema(
  {
    name: {
      type: String,
      default: '',
    },
    duration: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
      default: '',
    },
    offer_price: {
      type: String,
      default: '',
    },
    hasOffer: {
      type: Boolean,
      default: false,
    },
    stripe_price_id: {
      type: String,
      default: '',
    }
  },
  {
    timestamps: true,
  }
);

const Package = mongoose.model("Package", packageSchema);
module.exports = Package;
