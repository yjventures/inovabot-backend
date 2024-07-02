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
      type: String,
    },
    assistant_id: {
      type: Number, 
      default: otpStatus.UNUSED,
    },
  },
  {
    timestamps: true,  
  }
);

const Thread = mongoose.model("Thread", threadSchema);
module.exports = Thread;
