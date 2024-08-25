const mongoose = require("mongoose")

const categorySchema = mongoose.Schema(
  {
    title: {
      type: String,
      default: '',
      
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);


const categoryModel = mongoose.model("Category", categorySchema)

module.exports = categoryModel