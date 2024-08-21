const User = require("../models/user");
const {
  createUserService,
  checkTempPassword,
} = require("../services/invitation_services");
const { findUserById, updateUserById } = require("../services/user_services");
const {
  findCompanyById,
  updateCompanyById,
} = require("../services/company_services");
const mongoose = require("mongoose");
const { createError } = require("../common/error");
const { userType } = require("../utils/enums");

// * Function to sent invitation to an Admin
const sendAdminInvitationController = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    req.body.type = userType.ADMIN;
    const createUser = await createUserService(req, session);
    await session.commitTransaction();
    session.endSession();
    res.status(201).json(createUser);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to send invitation to a Reseller
const sendResellerInvitationController = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    req.body.type = userType.RESELLER;
    const createUser = await createUserService(req, session);
    await session.commitTransaction();
    session.endSession();
    res.status(201).json(createUser);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to send invitation to a user
const sendUserInvitationController = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    req.body.type = userType.USER;
    req.body.company_position = userType.USER;
    const createUser = await createUserService(req, session);
    await session.commitTransaction();
    session.endSession();
    res.status(200).json(createUser);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to send invitation to a company admin
const sendCompanyAdminInvitationController = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    let user = null;
    if (!req.body.company_id) {
      return next(createError(400, "Company id must be provided"));
    }
    const company = await findCompanyById(
      req.body.company_id,
      session
    );
    if (!company) {
      return next(createError(404, "Company not found"));
    }
    if (req?.body?.user_id) {
      const oldUser = await findUserById(req.body.user_id, session);
      user = await updateUserById(
        oldUser._id.toString(),
        {
          company_id: company._id,
          company_position: userType.COMPANY_ADMIN,
          has_company: true,
        },
        session
      );
    } else {
      if (!req?.body?.email) {
        return next(createError(400, "Email must be provided"));
      }
      req.body.type = userType.COMPANY_ADMIN;
      req.body.company_position = userType.COMPANY_ADMIN;
      req.body.has_company = true;
      user = await createUserService(req, session);
    }
    const oldAdminId = company.user_id.toString();
    if (oldAdminId) {
      const oldAdmin = await findUserById(oldAdminId, session);
      if (company._id && oldAdmin.company_id && company._id.equals(oldAdmin.company_id)) {
        const updatedOldAdmin = await updateUserById(
          oldAdminId,
          { company_id: null, has_company: false, company_position: "" },
          session
        );
      }
    }
    const updateCompany = await updateCompanyById(
      company._id.toString(),
      { user_id: user.user._id.toString() },
      session
    );
    await session.commitTransaction();
    session.endSession();
    res.status(200).json(user);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to check temporary password of a user
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
  sendCompanyAdminInvitationController,
};
