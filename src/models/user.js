const mongoose = require("mongoose");
const { userType } = require("../utils/enums");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
    },
    phone: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    birthdate: {
      type: Date,
      default: null,
    },
    type: {
      type: String,
      enum: [
        userType.SUPER_ADMIN,
        userType.ADMIN,
        userType.COMPANY_ADMIN,
        userType.RESELLER,
        userType.USER,
      ],
      default: "user",
    },
    last_subscribed: {
      type: Date,
      default: null,
    },
    expires_at: {
      type: Date,
      default: null,
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "Company",
    },
    company_position: {
      type: String,
      default: "",
    },
    has_company: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
