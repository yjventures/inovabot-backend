const mongoose = require('mongoose');
const Package = require("../models/package");
const { createError } = require("../common/error");

// & Function to create a new package
const createPackage = async (packageObj, session) => {
  try {
    const packageCollection = await new Package(packageObj);
    const package = await packageCollection.save({ session });
    if (package) {
      return package;
    } else {
      throw createError(400, "Package couldn't found");
    }
  } catch (err) {
    throw err;
  }
};

// & Function to get packages using querystring
const getPackageUsingQureystring = async (req, session) => {
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
      } else {
        query[item] = req?.query[item];
      }
    }
    const packages = await Package.find(query)
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit)
      .session(session);
    const count = await Package.countDocuments(query, {session});
    return { packages, total: count };
  } catch (err) {
    throw createError(404, "Package not found"); 
  }
};

// & Function to find a package by ID
const findPackageById = async (id, session) => {
  try {
    if (!id) {
      throw createError(400, "Id need to be provided");
    }
    const package = await Package.findById(id).session(session).lean();
    if (package) {
      return package;
    } else {
      throw createError(404, "Package not found");
    }
  } catch (err) {
    throw err;
  }
};

// & Function to update a package by ID
const updatePackageById = async (id, body, session) => {
  try {
    const query = await findPackageById(id, session);
    for (let item in body) {
      if (item === "recurring_date") {
        const date = new Date(body[item]);
        query[item] = date;
      } else if (item === "user_id" || item === "package") {
        query[item] = new mongoose.Types.ObjectId(body[item]);
      } else {
        query[item] = body[item];
      }
    }
    const updatePackage = await Package.findByIdAndUpdate(id, query, { new: true, session }).lean();
    if (!updatePackage) {
      throw createError(400, "Package not updated");
    } else {
      return { package: updatePackage };
    }
  } catch (err) {
    throw err;
  }
};


// & Function to delete a package by ID
const deletePackageById = async (id, session) => {
  try {
    const deletePackage = await Package.findByIdAndDelete(id).session(session);
    if (!deletePackage) {
      throw createError(404, "Package not found");
    } else {
      return { message: "Package is deleted" };
    }
  } catch (err) {
    throw err;
  }
};

module.exports = {
  createPackage,
  getPackageUsingQureystring,
  findPackageById,
  updatePackageById,
  deletePackageById
};