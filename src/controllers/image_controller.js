const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const {
  createImage,
  getImageUsingQureystring,
  findImageById,
  updateImageById,
  deleteImageById,
} = require("../services/image_services");
const { createError } = require("../common/error");

// * Function to create an image
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
      let imageObj = {};
      for (let item in req?.body) {
        if (item === 'bot_id') {
          imageObj[item] = new mongoose.Types.ObjectId(req?.body[item]);
        } else {
          imageObj[item] = req?.body[item];
        }
      }
      const image = await createImage(imageObj, session);
      if (image) {
        await session.commitTransaction();
        session.endSession();
        res
          .status(200)
          .json({ message: "successfull", image });
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

// * Function to get all the images using querystring
const getAllImage = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await getImageUsingQureystring(req, session);
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

// * Function to get an image by ID
const getImageByID = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const id = req?.params?.id;
    const image = await findImageById(id, session);
    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ image });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to update an image by ID
const updateImageByID = async (req, res, next) => {
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
      const image = await updateImageById(id, req.body, session);
      await session.commitTransaction();
      session.endSession();
      res.status(200).json(image);
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

// * Function to delete an image by ID
const deleteImageByID = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const id = req?.params?.id;
    if (!id) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "Not provide id"));
    } else {
      const message = await deleteImageById(id, session);
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
  getAllImage,
  getImageByID,
  updateImageByID,
  deleteImageByID,
}