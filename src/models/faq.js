const mongoose = require("mongoose")

const faqSchema = mongoose.Schema(
  {
    question: {
      type: String,
      intl: true,
    },
    answer: {
      type: String,
      intl: true,
    },
    bot_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: 'bot'
    },
    active: {
      type: Boolean,
      default: true,
    }
  },
  {
    timestamps: true,
  }
);


const faqModel = mongoose.model("Faq", faqSchema);

module.exports = faqModel;