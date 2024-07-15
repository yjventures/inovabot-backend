const mongoose = require('mongoose');
const File = require('../models/file');
const { createError } = require("../common/error");

// & Function to add a file to a bot
const addFile = async (fileObj, package, session) => {
  try {
    const result = await File.aggregate([
      {
        $match: { company_id: new mongoose.Types.ObjectId(fileObj.company_id) }
      },
      {
        $group: {
          _id: "$company_id",
          totalSize: { $sum: "$size" }
        }
      }
    ]);
    const totalSize = ((result.length) > 0 ? result[0].totalSize : 0) + fileObj.size;
    if (package.total_store_size < totalSize) {
      throw createError(400, "Maximum storage exceeded");
    }
    const fileCollection = await new File(fileObj);
    const file = await fileCollection.save({ session });
    if (!file) {
      throw createError(400, "File not created in DB");
    }
    return file;
  } catch (err) {
    throw err;
  }
};

// & Function to get a file
const getFile = async (id, session) => {
  try {
    const file = await File.findById(id).session(session).lean();
    if (!file) {
      throw createError(404, "File not found");
    }
    return file;
  } catch (err) {
    throw err;
  }
}

// & Function to delete a file
const deleteFile = async (id, session) => {
  try {
    const file = await File.findByIdAndDelete(id).session(session);
    if (!file) {
      throw createError(404, "File not found");
    }
    return { message: "File deleted" };
  } catch (err) {
    throw err;
  }
};

module.exports = {
  addFile,
  getFile,
  deleteFile,
}

// {
//   fieldname: 'file',
//   originalname: 'GRE 3 Geometry.pdf',
//   encoding: '7bit',
//   mimetype: 'application/pdf',
//   destination: '.\\src\\assets\\files',
//   filename: '18071730GRE 3 Geometry.pdf',
//   path: 'src\\assets\\files\\18071730GRE 3 Geometry.pdf',
//   size: 6333622
// }