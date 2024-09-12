const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const { EventEmitter } = require("events");
const {
  createAThread,
  getMessageById,
  getThreadById,
  runThreadById,
  addFileToThread,
  deleteFileFromThread,
} = require("../services/thread_services");
const { createError } = require("../common/error");

// * Function to get thread by ID
const getThreadByID = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const query = {};
    if (!req?.body?.thread_id) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "Thread ID not provided"));
    }
    if (req.body?.thread_id === 'new') {
      if (!req?.body?.bot_id) {
        await session.abortTransaction();
        session.endSession();
        return next(createError(400, "Assistant ID not provided for first time"));
      }
      query.bot_id = req?.body?.bot_id;
      if (req?.body?.user_id) {
        query.user_id = req.body?.user_id;
      }
      if (req?.body?.unique_id) {
        query.unique_id = req.body?.unique_id;
      }
      const thread = await createAThread(query, session);
      await session.commitTransaction();
      session.endSession();
      res.status(200).json({ thread });
    } else {
      const thread = await getThreadById(req?.body?.thread_id, session);
      await session.commitTransaction();
      session.endSession();
      res.status(200).json({ thread });
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to get message list
const getMessageListByID = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    if (!req?.params?.id) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "Thread ID not provided."));
    }
    const messages = await getMessageById(req.params.id, session);
    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ messages });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to run thread by ID
const runThreadByID = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    if (!req?.body?.thread_id) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "Thread ID not provided."));
    }
    if (!req?.body?.message) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "Message not provided."));
    }
    
    res.sseSetup();
    const eventEmitter = new EventEmitter();
    let streamClosed = false;

    eventEmitter.on("event", (data) => {
      if (streamClosed) {
        return;
      }
      if (data.event === "thread.message.delta") {
        res.sseSend(data.data.delta.content[0].text.value);
      } else if (data.event === "thread.run.completed") {
        res.sseStop();
        streamClosed = true;
      }
    });
    req.on("close", () => {
      streamClosed = true;
      eventEmitter.removeAllListeners("event");
    });
    
    const result = await runThreadById(req?.body?.thread_id, req?.body?.message, eventEmitter, session);
    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to upload a file to the thread by ID
const uploadFileToThread = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    if (!req.file) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "File not uploaded"));
    }
    const fileLocation = process.env.BULK_FILE_LOCATION;
    if (!fileLocation) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "env for file location is missing"));
    }
    const fullPath = path.join(
      fileLocation,
      req.file.filename
    );
    const thread_id = req?.body?.thread_id;
    if (!thread_id) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "thread_id not provided"));
    }
    const file = await addFileToThread(thread_id, fullPath, req.file, session);
    fs.unlinkSync(fullPath);
    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ message: "File added successfully", file });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to delete a file from thread by ID
const deleteFileFromThreadByID = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const thread_id = req?.body?.thread_id;
    const file_id = req?.body?.file_id;
    if (!thread_id || !file_id) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "Both thread_id and file_id need to be provided"));
    }
    const message = await deleteFileFromThread(thread_id, file_id, session);
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
  getThreadByID,
  getMessageListByID,
  runThreadByID,
  uploadFileToThread,
  deleteFileFromThreadByID,
}