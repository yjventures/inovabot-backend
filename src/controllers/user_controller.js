const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const {
  findUserById,
  findUserByObject,
  createUser,
  getUsers,
  updateUserById,
} = require("../services/user_services");
const { createError } = require("../common/error");

// * Function to create an user
const create = async (req, res, next) => {
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
        const exist = await findUserByObject({ email: req?.body?.email }, session);
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
      };
      const user = await createUser(userObj, req?.body?.password, session);
      if (user) {
        await session.commitTransaction();
        session.endSession();
        res
          .status(200)
          .json({ message: "User created successfully", user });
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
      return next(createError(404, "User not founr"));
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


module.exports = {
  create,
  getAllUser,
  getUserByID,
  updateUserByID,
}