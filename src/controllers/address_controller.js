const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const {
  createAddress,
  getAddressUsingQureystring,
  findAddressById,
  updateAddressById,
  deleteAddressById,
} = require("../services/address_services");
const { userType } = require("../utils/enums");
const { createError } = require("../common/error");

// * Function to create a address
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
      const addressObj = {};
      for (let item in req?.body) {
        addressObj[item] = req.body[item];
      }
      const address = await createAddress(addressObj, session);
      if (address) {
        await session.commitTransaction();
        session.endSession();
        res
          .status(200)
          .json({ message: "successfull", address });
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

// * Function to get all the addresses using querystring
const getAllAddress = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await getAddressUsingQureystring(req, session);
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

// * Function to get a address by ID
const getAddressByID = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const id = req?.params?.id;
    const address = await findAddressById(id, session);
    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ address });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to update a address by ID
const updateAddressByID = async (req, res, next) => {
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
      const address = await updateAddressById(id, req.body, session);
      await session.commitTransaction();
      session.endSession();
      res.status(200).json(address);
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

// * Function to delete a address by ID
const deleteAddressByID = async (req, res, next) => {
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
      const message = await deleteAddressById(id, session);
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
  getAllAddress,
  getAddressByID,
  updateAddressByID,
  deleteAddressByID,
}