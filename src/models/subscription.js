const mongoose = require("mongoose");

const subscriptionSchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: 'User',
    },
    package_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: 'Package',
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: 'Company',
    },
    subscription_id: {
      type: String,
      default: '',
    }
  },
  {
    timestamps: true,
  }
);

const subscription = mongoose.model("Subscription", subscriptionSchema);
module.exports = subscription;
