const mongoose = require("mongoose");
const Thread = require("../models/thread");
const File = require("../models/file");
const cron = require('node-cron');
const { createError } = require("../common/error");
const {
  createThread,
  getMessagesOfThread,
  runThread,
  getThread,
  addFileInVectorStore,
  deleteFileInVectorStore,
  stopRunThread,
} = require("../utils/open_ai_utils");
const { findBotById } = require("../services/bot_services");
const { addFile, getFile, deleteFile } = require("../services/file_services");

require('dotenv').config();

// & Schedule the job to run every minute
cron.schedule('* * * * *', async () => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const now = new Date();
    const expiredFiles = await File.find({
      expireAt: { $lt: now }
    }).session(session);

    for (const file of expiredFiles) {
      await deleteFileFromThread(file.thread_id, file._id, session);
    }
    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error during the cron job:', err);
  }
});

// & Function to create a new thread
const createAThread = async (body, session) => {
  try {
    const threadObj = {};
    for (let item in body) {
      if (item === "user_id" || item === "bot_id") {
        threadObj[item] = new mongoose.Types.ObjectId(body[item]);
      } else {
        threadObj[item] = body[item];
      }
    }
    const bot = await findBotById(threadObj.bot_id);
    if (!bot) {
      throw createError(404, "Bot not found");
    }
    threadObj.vector_store_id = bot.vector_store_id;
    threadObj.tool_resources = {
      file_search: {
        vector_store_ids: [bot.vector_store_id],
      },
    };
    const openAiThread = await createThread();
    if (openAiThread.id) {
      threadObj.thread_id = openAiThread.id;
    } else {
      throw createError(400, "Thread not created in openAI");
    }
    const threadCollection = await new Thread(threadObj);
    const thread = await threadCollection.save({ session });
    if (!thread) {
      throw createError(400, "Thread created in openAI but not in DB");
    } else {
      return thread;
    }
  } catch (err) {
    throw err;
  }
};

// & Function to get threads using querystring
const getThreadsUsingQueryString = async (req, session) => {
  try {
    const query = {};
    let page = 1,
      limit = 10;
    let sortBy = "createdAt";
    
    for (let item in req?.query) {
      if (item === "page") {
        page = Number(req?.query?.page);
        if (isNaN(page)) page = 1;
      } else if (item === "limit") {
        limit = Number(req?.query?.limit);
        if (isNaN(limit)) limit = 10;
      } else if (item === "sortBy" && req.query.sortBy) {
        sortBy = req?.query?.sortBy;
      } else if (item === "search") {
        const regex = new RegExp(req.query.search, "i");
        query.name = { $regex: regex };
      } else if (item === "company_id") {
        if (mongoose.Types.ObjectId.isValid(req?.query[item])) {
          query[item] = new mongoose.Types.ObjectId(req?.query[item]);
        }
      } else {
        query[item] = req?.query[item];
      }
    }
    const threads = await Thread.find(query)
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit)
      .session(session);
    if (!threads || threads.length === 0) {
      throw createError(404, "No threads found");
    }
    const count = await Thread.countDocuments(query, { session });
    return {
      data: threads,
      metadata: {
        totalDocuments: count,
        currentPage: page,
        totalPage: Math.max(1, Math.ceil(count / limit)),
      },
      message: "Success",
    };
  } catch (err) {
    throw err;
  }
};

// & Function to get thread by ID
const getThreadById = async (id, session) => {
  try {
    const thread = await Thread.findById(id).session(session).lean();
    if (!thread) {
      throw createError(404, "Could not find thread in DB");
    } else {
      const openAiThread = await getThread(thread.thread_id);
      if (!openAiThread) {
        throw createError(404, "Could not find thread in open-ai");
      } else {
        return thread;
      }
    }
  } catch (err) {
    throw err;
  }
};

// & Function to update a thread by ID
const updateThreadById = async (id, body, session) => {
  try {
    const query = await getThreadById(id, session);
    for (item in body) {
      if (item === "bot_id" || item === "user_id") {
        if (mongoose.Types.ObjectId.isValid(body[item])) {
          query[item] = new mongoose.Types.ObjectId(body[item]);
        }
      } else {
        query[item] = body[item];
      }
    }
    const updateThread = await Thread.findByIdAndUpdate(id, query, {
      new: true,
      session,
    }).lean();
    if (!updateThread) {
      throw createError(400, "Thread not updated");
    } else {
      return { thread: updateThread };
    }
  } catch (err) {
    throw err;
  }
};

// & Function to get messages from a thread by ID
const getMessageById = async (id, session) => {
  try {
    const thread = await getThreadById(id, session);
    const messages = await getMessagesOfThread(thread.thread_id);
    if (messages) {
      messages.sort((item1, item2) => {
        return item1.created_at - item2.created_at;
      });
      const tailoredMessage = messages.map((item) => (
        {
          id: item.id,
          role: item.role,
          content: item.content
        }
      ));
      return tailoredMessage;
    } else {
      throw createError(404, "No messages available");
    }
  } catch (err) {
    throw err;
  }
};

// & Function to run a thread by ID
const runThreadById = async (id, message, eventEmitter, session) => {
  try {
    const thread = await getThreadById(id, session);
    const bot = await findBotById(thread.bot_id, session);
    await runThread(bot.assistant_id, thread.thread_id, message, eventEmitter);
  } catch (err) {
    throw err;
  }
};

// & Function to stop a run by open ai id
const stopRun = async (thread_id, run_id) => {
  try {
    await stopRunThread(thread_id, run_id);
  } catch (err) {
    throw err;
  }
};

// & Upload file in thread by ID
const addFileToThread = async (id, file_path, file, session) => {
  try {
    const thread = await getThreadById(id, session);
    const bot = await findBotById(thread.bot_id, session);
    const myVectorStoreFile = await addFileInVectorStore(
      thread.vector_store_id,
      file_path
    );
    const file_id = myVectorStoreFile?.id;
    if (!file_id) {
      throw createError(400, "File not created in open-ai");
    } else {
      const minutes = process.env.FILE_DELETION_TIME || "30";
      const expireAt = new Date(Date.now() + (Number(minutes) * 60 * 1000));
      const fileObj = {
        name: file.originalname,
        size: file.size,
        file_id: file_id,
        company_id: bot.company_id,
        bot_id: bot._id,
        thread_id: id,
        expireAt,
      };
      const newFile = await addFile(fileObj, session);
      return newFile;
    }
  } catch (err) {
    throw err;
  }
};

// & Function to delete file from thread by ID
const deleteFileFromThread = async (thread_id, file_id, session) => {
  try {
    const thread = await getThreadById(thread_id, session);
    const file = await getFile(file_id, session);
    await deleteFileInVectorStore(thread.vector_store_id, file.file_id);
    const message = await deleteFile(file_id, session);
    return message;
  } catch (err) {
    throw err;
  }
};

module.exports = {
  createAThread,
  getMessageById,
  getThreadById,
  runThreadById,
  addFileToThread,
  deleteFileFromThread,
  stopRun,
  getThreadsUsingQueryString,
  updateThreadById,
};

// vs_EKBu7DPE3az7pdOn2wlvIdBv