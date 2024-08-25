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
    if (package.total_file_storage < totalSize) {
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

// & Function to get files using querystring
const getFiles = async (req, session) => {
  try {
    const query = {};
    let page = 1, limit = 10;
    let sortBy = "createdAt";
    for (let item in req?.query) {
      if (item === "page") {
        page = Number(req?.query?.page);
        if (isNaN(page)) {
          page = 1;
        }
      } else if (item === "limit") {
        limit = Number(req?.query?.limit);
        if (isNaN(limit)) {
          limit = 10;
        }
      } else if (item === "sortBy") {
        sortBy = req?.query?.sortBy;
      } else if (item === "company_id" || item === "bot_id" || item === "thread_id") {
        query[item] = new mongoose.Types.ObjectId(req?.query[item]);;
      } else if (item === "search") {
        const regex = new RegExp(req.query.search, "i");
        query.name = { $regex: regex };
      } else {
        query[item] = req?.query[item];
      }
    }
    const files = await File.find(query)
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit)
      .session(session);
    const count = await File.countDocuments(query, {session});
    return {
      data: files,
      metadata: {
        totalDocuments: count,
        currentPage: page,
        totalPage: Math.max(1, Math.ceil(count / limit)),
      },
      message: "Success",
    };
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
  getFiles,
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