const mongoose = require("mongoose");

const botSchema = mongoose.Schema(
  {
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: 'Company',
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: 'User',
    },
    name: {
      type: String,
      default: '',
    },
    assistant_id: {
      type: String,
      default: '',
    },
    vector_store_id: {
      type: String,
      default: '',
    },
    logo_light: {
      type: String,
      default: '',
    },
    logo_dark: {
      type: String,
      default: '',
    },
    bot_logo: {
      type: String,
      default: '',
    },
    user_logo: {
      type: String,
      default: '',
    },
    bg_light: {
      type: String,
      default: 'https://s3.ap-southeast-2.amazonaws.com/rfqbucketlbg1.jpeg',
    },
    bg_dark: {
      type: String,
      default: 'https://s3.ap-southeast-2.amazonaws.com/rfqbucketdbg1.jpeg',
    },
    description: {
      type: String,
      default: '',
    },
    system_prompt: {
      type: String,
      default: '',
    },
    faq: {
      type: Boolean,
      default: false,
    },
    image_display: {
      type: Boolean,
      default: false,
    },
    primary_color: {
      type: String,
      default: '#044088',
    },
    secondary_color: {
      type: String,
      default: '#050260',
    },
    font_color: {
      type: String,
      default: '#ffffff',
    },
    primary_color_dark: {
      type: String,
      default: '#044088',
    },
    secondary_color_dark: {
      type: String,
      default: '#050260',
    },
    font_color_dark: {
      type: String,
      default: '#ffffff',
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
    unique_id: {
      type: String,
      default: "",
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
    embedding_url: {
      type: String,
      unique: true,
      required: true,
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
      enum: ["en", "ar"],
      default: "en",
    },
    dark_mode: {
      type: Boolean,
      default: false,
    },
    bot_avatar: {
      type: String,
      default: "",
    },
    user_avatar: {
      type: String,
      default: "",
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

const Bot = mongoose.model("Bot", botSchema);
module.exports = Bot;