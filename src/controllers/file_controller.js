const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const {
  getFiles,
  getFile,
} = require("../services/file_services");
const { createError } = require("../common/error");

// * Function to get files using querystring
const getAllFiles = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const files = await getFiles(req, session);
    if (files) {
      await session.commitTransaction();
      session.endSession();
      res.status(200).json(files);
    } else {
      await session.abortTransaction();
      session.endSession();
      return next(createError(404, "Files not found"));
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to get a file by ID
const getFileById = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const id = req?.params?.id;
    const file = await getFile(id, session);
    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ file });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

module.exports = {
  getAllFiles,
  getFileById,
};