const mongoose = require("mongoose")

const faqSchema = mongoose.Schema(
  {
    question: {
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
      default: false,
    }
  },
  {
    timestamps: true,
  }
);


const faqModel = mongoose.model("Faq", faqSchema);

module.exports = faqModel;