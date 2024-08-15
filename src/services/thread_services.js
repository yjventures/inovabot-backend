const mongoose = require("mongoose");
const Thread = require("../models/thread");
const { createError } = require("../common/error");
const {
  createThread,
  getMessagesOfThread,
  runThread,
  getThread,
  addFileInVectorStore,
  deleteFileInVectorStore,
} = require("../utils/open_ai_utils");
const { findBotById } = require("../services/bot_services");
const { addFile, getFile, deleteFile } = require("../services/file_services");

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
const runThreadById = async (id, message, eventEmitter, instructions, session) => {
  try {
    const thread = await getThreadById(id, session);
    const bot = await findBotById(thread.bot_id, session);
    await runThread(bot.assistant_id, thread.thread_id, message, eventEmitter, instructions);
  } catch (err) {
    throw err;
  }
};

// & Upload file in thread by ID
const addFileToThread = async (id, file_path, file, package, session) => {
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
      const fileObj = {
        name: file.originalname,
        size: file.size,
        file_id: file_id,
        company_id: bot.company_id,
        thread_id: id,
      };
      const newFile = await addFile(fileObj, package, session);
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
};

// vs_EKBu7DPE3az7pdOn2wlvIdBv