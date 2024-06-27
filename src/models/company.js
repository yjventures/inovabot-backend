const mongoose = require("mongoose");

const companySchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: 'User',
    },
    name: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    logo: {
      type: String,
      default: '',
    },
    industry: {
      type: String,
      default: '',
    },
    web_url: {
      type: String,
      default: '',
    },
    payment_status: {
      type: Boolean,
      default: false,
    },
    payment_amount: {
      type: Number,
      default: 0,
    },
    recurring_date: {
      type: Date,
      default: new Date(),
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: 'Package',
    },
  },
  {
    timestamps: true,
  }
);

const Company = mongoose.model("Company", companySchema);
module.exports = Company;
