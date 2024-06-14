// * Function to forget password
const mongoose = require("mongoose");
const { findUserByObject } = require("../services/user_services");
const {
  requestChangePassword,
  resetPassword,
  verifyOtp,
} = require("../services/password_services");

// * Function for forget password
const forgetPassword = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    if (req?.body?.email) {
      const info = {
        email: req.body.email,
      };
      if (req?.body?.userType) {
        info.type = req.body.userType;
      }
      const user = await findUserByObject(info, session);
      const changeStatus = await requestChangePassword(info, session);
      if (changeStatus) {
        await session.commitTransaction();
        session.endSession();
        res.status(200).json({ message: "Otp sent successfully" });
      }
    } else {
      await session.abortTransaction();
      session.endSession();
      return next(400, "Email not provided");
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to verify password
const verifyPassword = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const email = req?.body?.email;
    const code = req?.body?.code;
    const otp = await verifyOtp(email, code, session);
    const info = { email: otp.email, type: otp.type };
    const user = await findUserByObject(info, session);
    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ message: "Verification successfull", user });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to reset password
const chnagePassword = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const id = req?.body?.id;
    const password = req?.body?.password;
    if (!id || !password) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "Both user id and password must be provided"));
    } else {
      const user = await resetPassword(id, password, session);
      await session.commitTransaction();
      session.endSession();
      return res.status(200).json({ message: "Successfully reset password", user });
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

module.exports = {
  forgetPassword,
  verifyPassword,
  chnagePassword,
};