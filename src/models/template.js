const mongoose = require("mongoose");

const templateSchema = mongoose.Schema(
  {
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: 'Company',
    },
    name: {
      type: String,
      default: '',
    },
    logo: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    system_prompt: {
      type: String,
      default: '',
    },
    model: {
      type: String,
      default: 'gpt-4o',
    },
    temperature: {
      type: Number,
      default: 0.5,
    },
    max_token: {
      type: Number,
      default: 1000,
    },
    stream: {
      type: Boolean,
      default: false,
    },
    top_p: {
      type: Number,
      default: 0.5,
    },
    frequency_penalty: {
      type: Number,
      default: 0.5,
    },
    first_message: {
      type: String,
      default: "",
    },
    context: {
      type: String,
      default: "",
    },
    objective: {
      type: String,
      default: "",
    },
    target_audience: {
      type: String,
      default: "",
    },
    call_to_action: {
      type: String,
      default: "",
    },
    format: {
      type: String,
      default: "",
    },
    avg_message_length: {
      type: Number,
      default: 1000,
    },
    tone_and_style: {
      type: String,
      default: "",
    },
    framework: {
      type: String,
      default: "",
    },
    language: {
      type: String,
      enum: ["en", "ac"],
      default: "en",
    },
    category: {
      type: String,
      default: "",
    },
    web_url: {
      type: String,
      default: "",
    },
    sounds_like: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Template = mongoose.model("Template", templateSchema);
module.exports = Template;
