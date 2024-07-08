const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const {
  createBotInstructions,
  createBot,
  getBotUsingQureystring,
  findBotById,
  updateBotById,
  deleteBotById,
} = require("../services/bot_services");
const { createError } = require("../common/error");

// * Function to create a bot/assistant
const create = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, errors));
    }
    const botObj = {};
    for (let item in req?.body) {
      if (item === "company_id" || item === "user_id") {
        botObj[item] = new mongoose.Types.ObjectId(req.body[item]);
      } else {
        botObj[item] = req.body[item];
      }
    }
    botObj.instructions = createBotInstructions(req);
    const bot = await createBot(botObj, session);
    if (!bot) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "Bot not created"));
    } else {
      await session.commitTransaction();
      session.endSession();
      res.status(200).json({ message: "Bot created successfully", bot });
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to get all the bots using querystring
const getAll = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const bots = await getBotUsingQureystring(req, session);
    if (bots) {
      await session.commitTransaction();
      session.endSession();
      res.status(200).json(bots);
    } else {
      await session.abortTransaction();
      session.endSession();
      return next(createError(404, "Bot not found"));
    }
  } catch (err) {
    next(err);
  }
};

// * Function to get a bot by ID
const getBotByID = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const id = req?.params?.id;
    const bot = await findBotById(id, session);
    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ bot });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to update bot by ID
const updateBotByID = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const id = req.params.id;
    if (!id) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "Id not provided"));
    }
    if (req?.body) {
      const bot = await updateBotById(id, req.body, session);
      if (!bot) {
        await session.abortTransaction();
        session.endSession();
        return next(createError(400, "Bot not updated"));
      } else {
        await session.commitTransaction();
        session.endSession();
        res.status(200).json(bot);
      }
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

// * Function to delete a bot by ID
const deleteBotByID = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const id = req.params.id;
    if (!id) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "Id not provided"));
    }
    const status = await deleteBotById(id, session);
    if (!status) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "Bot not deleted"));
    } else {
      await session.commitTransaction();
      session.endSession();
      res.status(200).json({ message: "Bot deleted successfully" });
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

module.exports = {
  create,
  getAll,
  getBotByID,
  updateBotByID,
  deleteBotByID,
};
