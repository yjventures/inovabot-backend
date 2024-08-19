const User = require("../models/user");
const {
  createUserService,createAdminService,createResellerService,
  checkTempPassword,
} = require("../services/invitation_services");
const mongoose = require("mongoose");
const { createError } = require("../common/error");

const sendUserInvitationController = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const createUser = await createUserService(req, session); // Await the function call
    await session.commitTransaction();
    session.endSession();

    res.status(201).json(createUser); // Send the createUser directly, no need to wrap in an object
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

const sendAdminInvitationController = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const createUser = await createAdminService(req, session); // Await the function call
    await session.commitTransaction();
    session.endSession();

    res.status(201).json(createUser); // Send the createUser directly, no need to wrap in an object
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

const sendResellerInvitationController = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const createUser = await createResellerService(req, session); // Await the function call
    await session.commitTransaction();
    session.endSession();

    res.status(201).json(createUser); // Send the createUser directly, no need to wrap in an object
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

const checkTempPasswordController = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const result = await checkTempPassword(req, session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json(result);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    if (
      error.message === "Invalid credentials." ||
      error.message === "Invalid OTP."
    ) {
      res.status(401).json({ status: "fail", message: error.message });
    } else {
      res.status(500).json({ status: "fail", message: error.message });
    }
  }
};
module.exports = { sendUserInvitationController, checkTempPasswordController, sendAdminInvitationController, sendResellerInvitationController };
