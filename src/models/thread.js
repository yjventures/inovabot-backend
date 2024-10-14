const mongoose = require("mongoose");

const threadSchema = mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: 'User',
    },
    unique_id: {
      type: String,
      default: '',
    },
    bot_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: 'Bot',
    },
    assistant_id: {
      type: String,
      default: '',
    },
    name: {
      type: String,
      default: '',
    },
    thread_id: {
      type: String,
      default: '',
    },
    vector_store_id: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,  
  }
);

const Thread = mongoose.model("Thread", threadSchema);
module.exports = Thread;
