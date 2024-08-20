const mongoose = require("mongoose")

const categorySchema = mongoose.Schema(
  {
    category_title: {
      type: String,
      intl: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);


const categoryModel = mongoose.model("Category", categorySchema)

module.exports = categoryModel