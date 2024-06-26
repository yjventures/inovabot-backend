const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const {
  findUserById,
  findUserByObject,
  createUser,
  getUsers,
  updateUserById,
  deleteUserById,
} = require("../services/user_services");
const { createError } = require("../common/error");
const { userType } = require("../utils/enums");
const { SendEmailUtils } = require("../utils/send_email_utils")
const {
  generateVerificationLink,
  decryptLink,
} = require("../utils/registration_utils");

// * Function to create an user
const create = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const link = req?.body?.link;
    if (link) {
      const userObj = decryptLink(link);
      const user = await createUser(userObj, userObj.password, session);
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
        type: req?.body?.type || "",
        password: req?.body?.password || "",
      };
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
    } else if (!req?.user?.type || req.user.type !== userType.ADMIN) {
      await session.abortTransaction();
      session.endSession();
      return next(
        createError(
          400,
          "You have to be admin or super admin to delete this account"
        )
      );
    } else {
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

module.exports = {
  requestCreate,
  create,
  getAllUser,
  getUserByID,
  updateUserByID,
  deleteUserByID,
};
