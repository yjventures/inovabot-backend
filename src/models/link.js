const mongoose = require("mongoose");

const linkSchema = mongoose.Schema(
  {
    bot_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: 'Bot',
    },
    link: {
      type: String,
      default: '',
    },
    objective: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Link = mongoose.model("Link", linkSchema);
module.exports = Link;
