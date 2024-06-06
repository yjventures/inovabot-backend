const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const {
  findUserByObject,
  createUser,
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

module.exports = {
  create,
}