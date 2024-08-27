const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const {
  createFaq,
  getFaqUsingQureystring,
  findFaqById,
  updateFaqById,
  deleteFaqById,
} = require("../services/faq_services");
const { userType } = require("../utils/enums");
const { createError } = require("../common/error");

// * Function to create a faq
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
      const faqObj = {};
      for (let item in req?.body) {
        if (item === 'bot_id') {
          faqObj[item] = new mongoose.Types.ObjectId(req.body[item]);
        } else {
          faqObj[item] = req.body[item];
        }
      }
      const faq = await createFaq(faqObj, session);
      if (faq) {
        await session.commitTransaction();
        session.endSession();
        res
          .status(200)
          .json({ message: "successfull", faq });
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

// * Function to get all the faqes using querystring
const getAllFaq = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await getFaqUsingQureystring(req, session);
    if (result) {
      await session.commitTransaction();
      session.endSession();
      res.status(200).json(result);
    } else {
      await session.abortTransaction();
      session.endSession();
      return next(createError(404, "Faq not found"));
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to get a faq by ID
const getFaqByID = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const id = req?.params?.id;
    const faq = await findFaqById(id, session);
    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ faq });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to update a faq by ID
const updateFaqByID = async (req, res, next) => {
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
      const faq = await updateFaqById(id, req.body, session);
      await session.commitTransaction();
      session.endSession();
      res.status(200).json(faq);
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

// * Function to delete a faq by ID
const deleteFaqByID = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const id = req?.params?.id;
    if (!id) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "Not provide id"));
    } else {
      const message = await deleteFaqById(id, session);
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
  getAllFaq,
  getFaqByID,
  updateFaqByID,
  deleteFaqByID,
}