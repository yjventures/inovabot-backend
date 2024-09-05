const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const {
  findUserById,
  findUserByObject,
  createUser,
  getUsers,
  updateUserById,
  deleteUserById,
  changeUserRolebyId,
} = require("../services/user_services");
const { findCompanyById } = require("../services/company_services");
const { handleEmailLogin } = require("../services/auth_services");
const { createError } = require("../common/error");
const { userType, userRoleType } = require("../utils/enums");
const { SendEmailUtils } = require("../utils/send_email_utils");
const {
  generateVerificationLink,
  decryptLink,
} = require("../utils/registration_utils");
const { precidency } = require("../utils/roles");

// TODO: Add API to invite an user in a company using company_id

// * Function to create an user
const create = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const link = req?.body?.link;
    if (link) {
      const userObj = decryptLink(link);
      const password = userObj.password;
      const newUser = await createUser(userObj, userObj.password, session);
      const { user } = await handleEmailLogin(
        userObj?.email,
        password,
        session
      );
      await session.commitTransaction();
      session.endSession();
      res.status(200).json({ message: "User created succesfully", user });
    } else {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "Link not provided"));
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to request to create an user
const requestCreate = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, errors));
    } else {
      if (req?.body?.email) {
        const exist = await findUserByObject(
          { email: req?.body?.email },
          session
        );
        if (exist) {
          await session.abortTransaction();
          session.endSession();
          return next(createError(400, "Email already exists"));
        }
      } else {
        await session.abortTransaction();
        session.endSession();
        return next(createError(400, "Did not provide email"));
      }
      const userObj = {
        name: req?.body?.name || "",
        email: req?.body?.email,
        phone: req?.body?.phone || "",
        birthdate: req?.body?.birthdate || "",
        address: req?.body?.address || "",
        type: req?.body?.type || userType.COMPANY_ADMIN,
        password: req?.body?.password || "",
      };
      if (req?.body?.type) {
        userObj.has_company = true;
      }
      // const user = await createUser(userObj, req?.body?.password, session);
      const link = generateVerificationLink(userObj);
      if (link) {
        const emailText = `Hi there!

        Welcome to ${process.env.NAME}. You've just signed up for a new account.
        Please click the link below to verify your email:

        ${link}
        
        Regards,
        The ${process.env.NAME} Team`;
        const emailSubject = `Verify your account at ${process.env.NAME}`;
        const emailStatus = await SendEmailUtils(
          req?.body?.email,
          emailText,
          emailSubject
        );

        const emailSent = emailStatus.accepted.find((item) => {
          return item === req?.body?.email;
        });
        if (!emailSent) {
          await session.abortTransaction();
          session.endSession();
          return next(createError(503, "Email did not send successfully"));
        }
        await session.commitTransaction();
        session.endSession();
        res.status(200).json({ message: "Link created successfully", link });
      } else {
        await session.abortTransaction();
        session.endSession();
        return next(createError(503, "User cannot be created"));
      }
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to get all users using querystring
const getAllUser = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const user_id = req?.user?.id;
    if (!user_id) {
      throw createError(404, "User not found");
    }
    if (req?.user?.type === userType.RESELLER) {
      throw createError(400, "Reseller can't get access");
    }
    if (req?.user?.type === userType.COMPANY_ADMIN) {
      const user = await findUserById(user_id);
      req.query.company_id = user.company_id;
    }
    const users = await getUsers(req, session);
    if (users) {
      await session.commitTransaction();
      session.endSession();
      res.status(200).json(users);
    } else {
      await session.abortTransaction();
      session.endSession();
      return next(createError(404, "User not found"));
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to find user by id
const getUserByID = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const id = req?.params?.id;
    const user = await findUserById(id, session);
    const company = await findCompanyById(user._id.toString(), session);
    if (
      req.user.type === userType.RESELLER &&
      company?.reseller_id.toString() !== req.user.id.toString()
    ) {
      throw createError(400, "Not on your authorization");
    }
    if (
      req.user.type === userType.COMPANY_ADMIN &&
      company?.user_id.toString() !== req.user.id.toString()
    ) {
      throw createError(400, "Not on your authorization");
    }
    if (
      req.user.type === userType.USER &&
      user._id.toString() !== req.user.id.toString()
    ) {
      throw createError(400, "Not on your authorization");
    }
    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ user });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to update user by ID
const updateUserByID = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const id = req?.params?.id;
    if (!id) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "Id not provided"));
    }
    if (req?.body) {
      const oldUser = await findUserById(id, session);
      const company = await findCompanyById(oldUser.company_id.toString(), session);
      if (
        req.user.type === userType.RESELLER &&
        company?.reseller_id.toString() !== req.user.id.toString()
      ) {
        throw createError(400, "Not on your authorization");
      }
      if (
        req.user.type === userType.COMPANY_ADMIN &&
        company?.user_id.toString() !== req.user.id.toString()
      ) {
        throw createError(400, "Not on your authorization");
      }
      if (
        req.user.type === userType.USER &&
        company?._id.toString() !== req.user.company_id.toString()
      ) {
        throw createError(400, "Not on your authorization");
      }
      if (precidency[req.user.type] < precidency[oldUser.type]) {
        throw createError(400, "Not on your authorization");
      }
      const user = await updateUserById(id, req.body, session);
      await session.commitTransaction();
      session.endSession();
      res.status(200).json(user);
    } else {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "No body provided"));
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to delete user by ID
const deleteUserByID = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const id = req?.params?.id;
    if (!id) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "Not provide user id"));
    } else {
      const oldUser = await findUserById(id, session);
      const company = await findCompanyById(oldUser.company_id.toString(), session);
      if (
        req.user.type === userType.RESELLER &&
        company?.reseller_id.toString() !== req.user.id.toString()
      ) {
        throw createError(400, "Not on your authorization");
      }
      if (
        req.user.type === userType.COMPANY_ADMIN &&
        company?.user_id.toString() !== req.user.id.toString()
      ) {
        throw createError(400, "Not on your authorization");
      }
      if (
        req.user.type === userType.USER &&
        company?._id.toString() !== req.user.company_id.toString()
      ) {
        throw createError(400, "Not on your authorization");
      }
      if (precidency[req.user.type] < precidency[oldUser.type]) {
        throw createError(400, "Not on your authorization");
      }
      const message = await deleteUserById(id, session);
      await session.commitTransaction();
      session.endSession();
      res.status(200).json(message);
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to change user role by ID
const changeUserRoleByID = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const user_id = req?.body?.user_id;
    const role_name = req?.body?.role_name;
    if (!user_id || !role_name) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "User id and role name must be provided"));
    }
    const oldUser = await findUserById(user_id, session);
    const company = await findCompanyById(oldUser.company_id.toString(), session);
    if (
      req.user.type === userType.RESELLER &&
      company?.reseller_id.toString() !== req.user.id.toString()
    ) {
      throw createError(400, "Not on your authorization");
    }
    if (
      req.user.type === userType.COMPANY_ADMIN &&
      company?.user_id.toString() !== req.user.id.toString()
    ) {
      throw createError(400, "Not on your authorization");
    }
    if (
      req.user.type === userType.USER &&
      company?._id.toString() !== req.user.company_id.toString()
    ) {
      throw createError(400, "Not on your authorization");
    }
    if (precidency[req.user.type] < precidency[oldUser.type]) {
      throw createError(400, "Not on your authorization");
    }
    const role = await changeUserRolebyId(user_id, role_name, session);
    const body = {};
    if (role_name === 'editor' || role_name === 'viewer') {
      body.type = userType.USER;
      body.company_position = role_name;
    } else {
      body.type = role_name;
    }
    const user = await updateUserById(user_id, body, session);
    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ message: "success", user, role });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

module.exports = {
  requestCreate,
  create,
  getAllUser,
  getUserByID,
  updateUserByID,
  deleteUserByID,
  changeUserRoleByID,
};
