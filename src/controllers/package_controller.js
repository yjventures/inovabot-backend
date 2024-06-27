const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const {
  createPackage,
  getPackageUsingQureystring,
  findPackageById,
  updatePackageById,
  deletePackageById,
} = require("../services/package_services");
const { userType } = require("../utils/enums");
const { createError } = require("../common/error");

// * Function to create a package
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
      const packageObj = {};
      for (let item in req?.body) {
        packageObj[item] = req.body[item];
      }
      const package = await createPackage(packageObj, session);
      if (package) {
        await session.commitTransaction();
        session.endSession();
        res
          .status(200)
          .json({ message: "successfull", package });
      } else {
        await session.abortTransaction();
        session.endSession();
        return next(createError(503, "Something went wrong"));
      }
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to get all the packages using querystring
const getAllPackage = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await getPackageUsingQureystring(req?.body, session);
    if (result) {
      await session.commitTransaction();
      session.endSession();
      res.status(200).json(result);
    } else {
      await session.abortTransaction();
      session.endSession();
      return next(createError(404, "Gives the error"));
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to get a package by ID
const getPackageByID = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const id = req?.params?.id;
    const package = await findPackageById(id, session);
    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ package });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to update a package by ID
const updatePackageByID = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const id = req?.params?.id;
    if (!id) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "Id not provided"))
    }
    if (req?.body) {
      const package = await updatePackageById(id, req.body, session);
      await session.commitTransaction();
      session.endSession();
      res.status(200).json(package);
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

// * Function to delete a package by ID
const deletePackageByID = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const id = req?.params?.id;
    if (!id) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "Not provide id"));
    } else if (
      req.user.type !== userType.ADMIN
    ) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "You have to be admin or super admin to delete"));
    } else {
      const message = await deletePackageById(id, session);
      await session.commitTransaction();
      session.endSession();
      res.json(200).json(message);
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

module.exports = {
  create,
  getAllPackage,
  getPackageByID,
  updatePackageByID,
  deletePackageByID,
}