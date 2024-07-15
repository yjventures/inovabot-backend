const mongoose = require('mongoose');
const File = require('../models/file');
const { createError } = require("../common/error");

// & Function to add a file to a bot
const addFile = async (fileObj, session) => {
  try {
    const result = await File.aggregate([
      {
        $match: { company_id: mongoose.Types.ObjectId(fileObj.company_id) }
      },
      {
        $group: {
          _id: "$company_id",
          totalSize: { $sum: "$size" }
        }
      }
    ]);
    const totalSize = ((result.length) > 0 ? result[0].totalSize : 0) + fileObj.size;
    // TODO: DO later
  } catch (err) {
    throw err;
  }
};

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