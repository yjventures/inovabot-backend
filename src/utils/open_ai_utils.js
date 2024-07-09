const { OpenAI } = require("openai");
const { EventEmitter } = require("events");
require("dotenv").config();

const openAiConfig = {
  apiKey: process.env.OPENAI_API,
};

const openai = new OpenAI(openAiConfig);

class EventHandler extends EventEmitter {
  constructor(client, eventEmitter) {
    super();
    this.client = client;
    this.eventEmitter = eventEmitter;
  }

  async onEvent(event) {
    try {
      this.eventEmitter.emit('event', event);
      // Retrieve events that are denoted with 'requires_action' since these will have our tool_calls
      if (event.event === "thread.run.requires_action") {
        await this.handleRequiresAction(
          event.data,    
          event.data.id,
          event.data.thread_id,
        );
      }
    } catch (error) {
      console.error("Error handling event:", error);
    }
  }

  async handleRequiresAction(data, runId, threadId) {
    try {
      const toolOutputs = [];
      for (let toolCall of data.required_action.submit_tool_outputs.tool_calls) {
        if (toolCall.function.name === "lookUpTime") {
          const args = JSON.parse(toolCall.function.arguments);
          const time = await lookUpTime(args.location);
          toolOutputs.push({ tool_call_id: toolCall.id, output: time });
        }
      }
      // Submit all the tool outputs at the same time
      await this.submitToolOutputs(toolOutputs, runId, threadId);
    } catch (error) {
      console.error("Error processing required action:", error);
    }
  }

  async submitToolOutputs(toolOutputs, runId, threadId) {
    try {
      // Use the submitToolOutputsStream helper
      const stream = this.client.beta.threads.runs.submitToolOutputsStream(
        threadId,
        runId,
        { tool_outputs: toolOutputs },
      );
      for await (const event of stream) {
        this.emit("event", event);
      }
    } catch (error) {
      console.error("Error submitting tool outputs:", error);
    }
  }
}

// ^ Function to create assistant
const createAssistant = async (body) => {
  try {
    const assistant = await openai.beta.assistants.create(body);
    return assistant;
  } catch (err) {
    throw err;
  }
};

// ^ Function to get list of assistant
const listOfAssistants = async () => {
  try {
    const assistants = await openai.beta.assistants.list();
    return assistants;
  } catch (err) {
    throw err;
  }
};

// ^ Function to get a assistant by id
const getAssistantById = async (id) => {
  try {
    const assistent = await openai.beta.assistants.retrieve(id);
    return assistent;
  } catch (err) {
    throw err; 
  }
};

// ^ Function to update a assistant by id
const updateAssistantById = async (id, assistantObj) => {
  try {
    const assistant = await openai.beta.assistants.update(
      id,
      assistantObj,
    );
    if (assistant) {
      return assistant;
    } else {
      return null;
    }
  } catch (err) {
    throw err;
  }
};

// ^ Function to delete a assistant by id
const deleteAssistantById = async (id) => {
  try {
    const response = await openai.beta.assistants.del(id);
    if (response.deleted) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    throw err;
  }
};

// ^ Function to create a thread
const createThread = async () => {
  try {
    const thread = await openai.beta.threads.create();
    return thread;
  } catch (err) {
    throw err;
  }
};

// ^ Function to get a thread
const getThread = async (thread_id) => {
  try {
    const thread = await openai.beta.threads.retrieve(thread_id);
    return thread;
  } catch (err) {
    throw err;
  }
};

// ^ Function to get list of mesages in a thread
const getMessagesOfThread = async (thread_id) => {
  try {
    const messageListObj = await openai.beta.threads.messages.list(thread_id);
    return messageListObj.data;
  } catch (err) {
    throw err;
  }
};

// ^ Function to run a thread
const runThread = async (assistant_id, thread_id, mainPrompt, eventEmitter, instructions) => {
  try {
    const message = await openai.beta.threads.messages.create(
      thread_id,
      {
        role: "user",
        content: mainPrompt,
      }
    );
    const eventHandler = new EventHandler(openai, eventEmitter);
    eventHandler.on("event", eventHandler.onEvent.bind(eventHandler));
    const run = openai.beta.threads.runs.stream (
      thread_id,
      {
        assistant_id,
        instructions,
      },
      eventHandler,
    );
    for await (const event of run) {
      eventHandler.emit("event", event);
    }
  } catch (err) {
    throw err;
  }
};

module.exports = {
  createAssistant,
  listOfAssistants,
  getAssistantById,
  updateAssistantById,
  deleteAssistantById,
  createThread,
  getMessagesOfThread,
  runThread,
  getThread,
};

// * Here is a template for the tools
// [
//   {
//     type: "code_interpreter"
//   },
//   {
//     type: "function",
//     function: {
//       name: "lookUpTime",
//       description: "get the current time in a given location",
//       parameters: {
//         type: "object",
//         properties: {
//           location: {
//             type: "string",
//             description: "the location e.g. Islamabad, Pakistan. But it should be written in a timezone like Europe/Paris"
//           }
//         },
//         required: ["location"]
//       }
//     }
//   }
// ]