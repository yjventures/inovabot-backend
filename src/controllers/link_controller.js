const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const {
  createLink,
  getLinkUsingQureystring,
  findLinkById,
  updateLinkById,
  deleteLinkById,
} = require("../services/link_services");
const { userType } = require("../utils/enums");
const { createError } = require("../common/error");

// * Function to create a link
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
      const linkObj = {};
      for (let item in req?.body) {
        linkObj[item] = req.body[item];
      }
      const link = await createLink(linkObj, session);
      if (link) {
        await session.commitTransaction();
        session.endSession();
        res
          .status(200)
          .json({ message: "successfull", link });
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

// * Function to get all the links using querystring
const getAllLink = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await getLinkUsingQureystring(req, session);
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

// * Function to get a link by ID
const getLinkByID = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const id = req?.params?.id;
    const link = await findLinkById(id, session);
    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ link });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to update a link by ID
const updateLinkByID = async (req, res, next) => {
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
      const link = await updateLinkById(id, req.body, session);
      await session.commitTransaction();
      session.endSession();
      res.status(200).json(link);
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

// * Function to delete a link by ID
const deleteLinkByID = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const id = req?.params?.id;
    if (!id) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "Not provide id"));
    } else {
      const message = await deleteLinkById(id, session);
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
  create,
  getAllLink,
  getLinkByID,
  updateLinkByID,
  deleteLinkByID,
}