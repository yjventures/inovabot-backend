const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const { validationResult } = require("express-validator");
const {
  createBotInstructions,
  createBot,
  getBotUsingQureystring,
  findBotById,
  findBotByUrl,
  updateBotById,
  deleteBotById,
  addFileToBot,
  deleteFileFromBot,
  countBot,
} = require("../services/bot_services");
const { checkMemory } = require("../services/file_services");
const {
  findCompanyByObject,
  findCompanyById,
} = require("../services/company_services");
const { createError } = require("../common/error");
const { userType } = require("../utils/enums");

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
    const id = req.user.id;
    let company = null;
    if (req?.body?.company_id) {
      company = await findCompanyById(req.body.company_id, session);
    } else {
      company = await findCompanyByObject({ user_id: id }, session);
    }
    if (!company) {
      return next(createError(404, "Company not found"));
    }
    if (
      req?.user?.type === userType.RESELLER &&
      company?.reseller_id.toString() !== user_id.toString()
    ) {
      return next(createError(404, "Permission denied"));
    }
    if (
      req?.user?.type === userType.COMPANY_ADMIN &&
      company?.user_id.toString() !== user_id.toString()
    ) {
      return next(createError(404, "Permission denied"));
    }
    const package = req?.body?.package;
    if (!package) {
      return next(createError(400, "Package not found"));
    }
    const botCount = await countBot(company._id, session);
    if (botCount >= Number(package['bot_limit'])) {
      return next(createError(400, "Bot limit exceeded, please upgrade your package"));
    }
    const botObj = {
      user_id: id,
      company_id: company?._id,
      model: "gpt-4-turbo",
    };
    for (let item in req?.body) {
      if (item === "company_id" || item === "user_id") {
        botObj[item] = new mongoose.Types.ObjectId(req.body[item]);
      } else if (item === "model") {
        botObj[item] = req?.body?.model || "gpt-4-turbo";
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
    const usedStorage = await checkMemory(bot.company_id, 0, session);
    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ data: bot, usedStorage });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to get a bot by embedding url
const getBotByURL = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const url = req?.params?.url;
    const bot = await findBotByUrl(url, session);
    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ data: bot });
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
      const oldBot = await findBotById(id, session);
      const company = await findCompanyById(oldBot.company_id, session);
      if (
        req.user.type === userType.RESELLER &&
        company?.reseller_id.toString() !== req.user.id.toString()
      ) {
        throw createError(400, "Not on your authorization");
      }
      if (
        req.user.type === userType.COMPANY_ADMIN &&
        company?.user_id.toString() !== req.user.id.toString()
      ) {
        throw createError(400, "Not on your authorization");
      }
      if (
        req.user.type === userType.USER &&
        company?._id.toString() !== req.user.company_id.toString()
      ) {
        throw createError(400, "Not on your authorization");
      }
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
    const oldBot = await findBotById(id, session);
    const company = await findCompanyById(oldBot.company_id, session);
    if (
      req.user.type === userType.RESELLER &&
      company?.reseller_id.toString() !== req.user.id.toString()
    ) {
      throw createError(400, "Not on your authorization");
    }
    if (
      req.user.type === userType.COMPANY_ADMIN &&
      company?.user_id.toString() !== req.user.id.toString()
    ) {
      throw createError(400, "Not on your authorization");
    }
    if (
      req.user.type === userType.USER &&
      company?._id.toString() !== req.user.company_id.toString()
    ) {
      throw createError(400, "Not on your authorization");
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

// * Function to upload a file to the bot by ID
const uploadFileToBot = async (req, res, next) => {
  const session = await mongoose.startSession();
  let fullPath = null;
  try {
    session.startTransaction();
    if (!req.file) {
      return next(createError(400, "File not uploaded"));
    }
    const fileLocation = process.env.BULK_FILE_LOCATION;
    if (!fileLocation) {
      return next(createError(400, "env for file location is missing"));
    }
    fullPath = path.join(fileLocation, req.file.filename);
    const bot_id = req?.body?.bot_id;
    if (!bot_id) {
      return next(createError(400, "bot_id not provided"));
    }
    const package = req?.body?.package;
    if (!package) {
      return next(createError(400, "Package not found"));
    }
    const file = await addFileToBot(
      bot_id,
      fullPath,
      req.file,
      package,
      session
    );
    fs.unlinkSync(fullPath);
    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ message: "File added successfully", file });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    fs.unlinkSync(fullPath);
    next(err);
  }
};

// * Function to delete a file from Bot by ID
const deleteFileFromBotByID = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const bot_id = req?.body?.bot_id;
    const file_id = req?.body?.file_id;
    if (!bot_id || !file_id) {
      return next(
        createError(400, "Both bot_id and file_id need to be provided")
      );
    }
    const message = await deleteFileFromBot(bot_id, file_id, session);
    await session.commitTransaction();
    session.endSession();
    res.status(200).json(message);
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
  getBotByURL,
  updateBotByID,
  deleteBotByID,
  uploadFileToBot,
  deleteFileFromBotByID,
};
