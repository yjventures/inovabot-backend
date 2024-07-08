// const mongoose = require("mongoose");

// const packageSchema = mongoose.Schema(
//   {
//     name: {
//       type: String,
//       default: '',
//     },
//     duration: {
//       type: String,
//       default: '',
//     },
//     price: {
//       type: Number,
//       default: 0,
//     },
//     image: {
//       type: String,
//       default: '',
//     },
//     offer_price: {
//       type: String,
//       default: '',
//     },
//     hasOffer: {
//       type: Boolean,
//       default: false,
//     },
//     stripe_price_id: {
//       type: String,
//       default: '',
//     }
//   },
//   {
//     timestamps: true,
//   }
// );

// const Package = mongoose.model("Package", packageSchema);
// module.exports = Package;

const mongoose = require("mongoose");

const featureSchema = mongoose.Schema({
  feature: {
    type: String,
    required: true,
  },
  type: {
    type: String, // Store the type as a string, e.g., 'Number', 'Boolean'
    required: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
});

const priceSchema = mongoose.Schema({
  price: {
    type: String,
    required: true,
  },
  currency: {
    type: String,
    required: true,
  },
  stripe_id: {
    type: String,
    required: true,
  },
});

const packageSchema = mongoose.Schema(
  {
    name: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    features: [featureSchema],
    price: {
      monthly: priceSchema, 
      yearly: priceSchema,
    },
  },
  {
    timestamps: true,
  }
);

const Package = mongoose.model("Package", packageSchema);
module.exports = Package;
