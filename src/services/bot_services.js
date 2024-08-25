const mongoose = require('mongoose');
const Bot = require("../models/bot");
const { createError } = require("../common/error");
const {
  createAssistant,
  listOfAssistants,
  getAssistantById,
  updateAssistantById,
  deleteAssistantById,
  createVectorStore,
  deleteVectorStore,
  addFileInVectorStore,
  deleteFileInVectorStore,
} = require("../utils/open_ai_utils");
const { addFile, getFile, deleteFile } = require("../services/file_services");
const { incrementInCompany } = require("../services/company_services");

// & Function to create bot instructions
const createBotInstructions = (req) => {
  try {
    let instruction = "";
    if (req?.body?.name) {
      instruction += `Your name is ${req.body?.name}`;
    }
    if (req?.body?.context) {
      instruction += `\n\nContext:\n${req.body?.context}`;
    }
    if (req?.body?.objective) {
      instruction += `\n\nObjective:\n${req.body.objective}`;
    }
    if (req?.body?.target_audience) {
      instruction += `\n\nTarget audience:\n${req.body.target_audience}`;
    }
    if (req?.body?.call_of_action) {
      instruction += `\n\nPrompt the user to this call of action when applicable:\n${req.body.call_of_action}`;
    }
    if (req?.body?.tone_and_style) {
      instruction += `\n\nTone/Style:\n${req.body.tone_and_style}`;
    }
    if (req?.body?.framework) {
      instruction += `\n\nFramework to follow:\n${req.body.framework}`;
    }
    if (req?.body?.format) {
      instruction += `\n\nFormatting and structure:\n${req.body.format}`;
    }
    if (req?.body?.first_message) {
      instruction += `\n\nFirst message:\n${req.body.first_message}`;
    }
    instruction += `\n\nIgnore any empty fiends in your instructions.\n\nYou will respond in clean, proper HTML so the application can render it straight away. Normal text will be wrapped in a <p> tag. You will format the links as html links with an <a> tag. Links will have yellow font. Use divs and headings to properly separate different sections. Make sure text doesn't overlap and there is adequate line spacing.`;
    return instruction;
  } catch (err) {
    throw err;
  }
};

// & Function to create bot parameter
const createParam = (botObj) => {
  try {
    const botBody = {};
    botBody.name = botObj.name;
    botBody.instructions = botObj.instructions;
    botBody.model = botObj.model;
    if (botObj.tools) {
      botBody.tools = botObj.tools;
    }
    if (botObj.top_p) {
      botBody.top_p = botObj.top_p;
    }
    if (botObj.temparature) {
      botBody.temparature = botObj.temparature;
    }
    if (botObj.description) {
      botBody.description = botObj.description;
    }
    if (botObj.max_tokens) {
      botBody.max_tokens = botObj.max_token;
    }
    if (botObj.tool_resources) {
      botBody.tool_resources = botObj.tool_resources;
    }
    return botBody;
  } catch (err) {
    throw err;
  }
};

// & Function to create a new assistant/bot
const createBot = async (botObj, session) => {
  try {
    const tools = [
      {
        type: "code_interpreter",
      },
      {
        type: "file_search",
      },
    ];
    if (botObj.impage_display) {
      tools.push({
        type: "function",
        function: {
          name: "imageDisplay",
          description: "get the current time in a given location",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "the url of an image",
              },
            },
            required: ["url"],
          },
        },
      });
    }
    botObj.tools = tools;
    const vectorStore = await createVectorStore(botObj.name);
    if (!vectorStore.id) {
      throw createError(400, "Can't create vector storage in open AI");
    }
    botObj.vector_store_id = vectorStore.id;
    botObj.tool_resources = {
      file_search: {
        vector_store_ids: [vectorStore.id],
      },
    };
    const botBody = createParam(botObj);
    const openAiBot = await createAssistant(botBody);
    if (openAiBot?.id) {
      botObj.assistant_id = openAiBot.id;
    } else {
      throw createError(400, "Can't create bot in open AI");
    }
    const botCollection = await new Bot(botObj);
    const bot = await botCollection.save({ session });
    if (bot) {
      const company = await incrementInCompany(bot.company_id, 'bots', 1, session);
      if (!company) {
        throw createError(400, "Company couldn't response");  
      }
      return bot;
    } else {
      throw createError(400, "Bot couldn't create");
    }
  } catch (err) {
    throw err;
  }
};

// & Function to get botes using querystring
const getBotUsingQureystring = async (req, session) => {
  try {
    const query = {};
    let page = 1,
      limit = 10;
    let sortBy = "createdAt";
    for (let item in req?.query) {
      if (item === "page") {
        page = Number(req?.query?.page);
        if (isNaN(page)) {
          page = 1;
        }
      } else if (item === "limit") {
        limit = Number(req?.query?.limit);
        if (isNaN(limit)) {
          limit = 10;
        }
      } else if (item === "sortBy") {
        sortBy = req?.query?.sortBy;
      } else {
        query[item] = req?.query[item];
      }
    }
    const bots = await Bot.find(query)
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit)
      .session(session);
    const count = await Bot.countDocuments(query, { session });
    return {
      data: bots,
      metadata: {
        totalDocuments: count,
        currentPage: page,
        totalPage: Math.max(1, Math.ceil(count / limit)),
      },
      message: "Success",
    };
  } catch (err) {
    throw createError(404, "Bot not found");
  }
};

// & Function to find a bot by ID
const findBotById = async (id, session) => {
  try {
    if (!id) {
      throw createError(400, "Id need to be provided");
    }
    const bot = await Bot.findById(id).session(session).lean();
    if (bot) {
      return bot;
    } else {
      throw createError(404, "Bot not found");
    }
  } catch (err) {
    throw err;
  }
};

// & Function to update a bot by ID
const updateBotById = async (id, body, session) => {
  try {
    const bot = await findBotById(id, session);
    for (let item in body) {
      if (item === "recurring_date") {
        const date = new Date(body[item]);
        bot[item] = date;
      } else if (item === "user_id" || item === "package") {
        bot[item] = new mongoose.Types.ObjectId(body[item]);
      } else {
        bot[item] = body[item];
      }
    }
    const req = { body: bot };
    bot.instructions = createBotInstructions(req);
    const tools = [
      {
        type: "code_interpreter",
      },
    ];
    if (body?.image_display) {
      tools.push({
        type: "function",
        function: {
          name: "imageDisplay",
          description: "get the current time in a given location",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "the url of an image",
              },
            },
            required: ["url"],
          },
        },
      });
    }
    bot.tools = tools;
    const botBody = createParam(bot);
    const openAiBot = updateAssistantById(bot.assistant_id, botBody);
    if (!openAiBot) {
      throw createError(400, "Bot not updated in open-ai");
    }
    const updateBot = await Bot.findByIdAndUpdate(id, bot, {
      new: true,
      session,
    }).lean();
    if (!updateBot) {
      throw createError(400, "Bot not updated in DB but updated in open-ai");
    } else {
      return { bot: updateBot };
    }
  } catch (err) {
    throw err;
  }
};

// & Function to delete a bot by ID
const deleteBotById = async (id, session) => {
  try {
    const bot = await findBotById(id, session);
    const isVectorStoreDeleted = await deleteVectorStore(bot.vector_store_id);
    const isDeleted = await deleteAssistantById(bot.assistant_id);
    if (!isDeleted) {
      throw createError(400, "Bot not deleted in open-ai");
    }
    const deleteBot = await Bot.findByIdAndDelete(id).session(session);
    if (!deleteBot) {
      throw createError(404, "Bot not deleted in db but deleted in open-ai");
    } else {
      return { message: "Bot is deleted" };
    }
  } catch (err) {
    throw err;
  }
};

// & Function to add file to bot by ID
const addFileToBot = async (id, file_path, file, package, session) => {
  try {
    const bot = await findBotById(id, session);
    const myVectorStoreFile = await addFileInVectorStore(
      bot.vector_store_id,
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
        bot_id: id,
      };
      const newFile = await addFile(fileObj, package, session);
      return newFile;
    }
  } catch (err) {
    throw err;
  }
};

// & Function to delete file from bot by ID
const deleteFileFromBot = async (bot_id, file_id, session) => {
  try {
    const bot = await findBotById(bot_id, session);
    const file = await getFile(file_id, session);
    await deleteFileInVectorStore(bot.vector_store_id, file.file_id);
    const message = await deleteFile(file_id, session);
    return message;
  } catch (err) {
    throw err;
  }
};

module.exports = {
  createBotInstructions,
  createBot,
  getBotUsingQureystring,
  findBotById,
  updateBotById,
  deleteBotById,
  addFileToBot,
  deleteFileFromBot,
};
