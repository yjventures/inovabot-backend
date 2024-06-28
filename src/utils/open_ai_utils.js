const { OpenAI } = require("openai");
require("dotenv").config();

const openAiConfig = {
  apiKey: process.env.OpenAI_API,
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
      console.log(event);
      
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
const createAssistant = async (model, name, instructions, tools) => {
  const assistant = await openai.beta.assistants.create({
    name,
    instructions,
    model,
    tools,
  });
  return assistant;
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

// ^ Function to run assistant
const runAssistant = async (id, mainPrompt, eventEmitter) => {
  try {
    const thread  = await openai.beta.threads.create();
    const message = await openai.beta.threads.messages.create(
      thread.id,
      {
        role: "user",
        content: mainPrompt
      }
    );
    const eventHandler = new EventHandler(openai, eventEmitter);
    eventHandler.on("event", eventHandler.onEvent.bind(eventHandler));
    const run = openai.beta.threads.runs.stream (
      thread.id,
      {
        assistant_id: id,
        instructions: "You will teach the user how to solve it."
      },
      eventHandler,
    );
    for await (const event of run) {
      eventHandler.emit("event", event);
    }
      // & To here }
  } catch(err) {
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

module.exports = {
  createAssistant,
  listOfAssistants,
  getAssistantById,
  runAssistant,
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