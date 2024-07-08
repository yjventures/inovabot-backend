const mongoose = require("mongoose");
const { EventEmitter } = require("events");
const {
  createAThread,
  getMessageById,
  getThreadById,
  runThreadById,
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
      if (!req?.body?.assistant_id) {
        await session.abortTransaction();
        session.endSession();
        return next(createError(400, "Assistant ID not provided for first time"));
      } 
      query.assistant_id = req.body?.assistant_id;
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
    if (!req?.query?.id) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "Thread ID not provided."));
    }
    const messages = await getMessageById(req.query.id, session);
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
    if (!req?.body?.instructions) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "Instructions not provided."));
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
    
    const result = await runThreadById(req?.body?.thread_id, req?.body?.message, eventEmitter, req?.body?.instructions, session);
    await session.commitTransaction();
    session.endSession();
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
}