const User = require("../models/user");
const {
  createUserService,
  checkTempPassword,
} = require("../services/invitation_services");
const mongoose = require("mongoose");
const { createError } = require("../common/error");
const { userType } = require("../utils/enums");

const sendAdminInvitationController = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    req.body.type = userType.ADMIN;
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

const sendResellerInvitationController = async (req, res, next) => {
  const session = await mongoose.startSession(); 
  try {
    session.startTransaction();
    req.body.type = userType.RESELLER;
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

const sendUserInvitationController = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    req.body.type = userType.USER;
    req.body.company_position = userType.USER;
    const createUser = await createUserService(req, session); // Await the function call
    await session.commitTransaction();
    session.endSession();

    res.status(200).json(createUser); // Send the createUser directly, no need to wrap in an object
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
      return next(createError(400, error.message));
    } else {
      return next(createError(500, error.message));
    }
  }
};


module.exports = {
  sendAdminInvitationController,
  sendResellerInvitationController,
  sendUserInvitationController,
  checkTempPasswordController,
};
