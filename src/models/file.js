const mongoose = require('mongoose');

const fileSchema = mongoose.Schema(
  {
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: 'Company',
    },
    bot_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bot',
    },
    thread_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Thread',
    },
    name: {
      type: String,
      default: '',
    },
    size: {
      type: Number,
      default: 0,
    },
    file_id: {
      type: String,
      default: '',
    },
    url: {
      type: String,
      default: '',
    }
  },
  {
    timestamps: true,
  }
);

const File = mongoose.model("File", fileSchema);
module.exports = File;
