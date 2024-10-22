const mongoose = require("mongoose");

const imageSchema = mongoose.Schema(
  {
    bot_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: 'Bot',
    },
    image_url: {
      type: [
        {
          type: String,
        }
      ],
      default: [],
    },
    file_id: {
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

const Image = mongoose.model("Image", imageSchema);
module.exports = Image;
