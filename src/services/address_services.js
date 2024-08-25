const mongoose = require('mongoose');
const Address = require("../models/address");
const { createError } = require("../common/error");

// & Function to create a new address
const createAddress = async (addressObj, session) => {
  try {
    const addressCollection = await new Address(addressObj);
    const address = await addressCollection.save({ session });
    if (address) {
      return address;
    } else {
      throw createError(400, "Address couldn't found");
    }
  } catch (err) {
    throw err;
  }
};

// & Function to get addresses using querystring
const getAddressUsingQureystring = async (req, session) => {
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
      } else if (item === "search") {
        const regex = new RegExp(req.query.search, "i");
        query.name = { $regex: regex };
      } else if (item === "sortBy") {
        sortBy = req?.query?.sortBy;
      } else {
        query[item] = req?.query[item];
      }
    }
    const addresses = await Address.find(query)
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit)
      .session(session);
    const count = await Address.countDocuments(query, {session});
    return {
      data: addresses,
      metadata: {
        totalDocuments: count,
        currentPage: page,
        totalPage: Math.max(1, Math.ceil(count / limit)),
      },
      message: "Success",
    };
  } catch (err) {
    throw createError(404, "Address not found"); 
  }
};

// & Function to find a address by ID
const findAddressById = async (id, session) => {
  try {
    if (!id) {
      throw createError(400, "Id need to be provided");
    }
    const address = await Address.findById(id).session(session).lean();
    if (address) {
      return address;
    } else {
      throw createError(404, "Address not found");
    }
  } catch (err) {
    throw err;
  }
};

// & Function to update a address by ID
const updateAddressById = async (id, body, session) => {
  try {
    const query = await findAddressById(id, session);
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
    const updateAddress = await Address.findByIdAndUpdate(id, query, { new: true, session }).lean();
    if (!updateAddress) {
      throw createError(400, "Address not updated");
    } else {
      return { address: updateAddress };
    }
  } catch (err) {
    throw err;
  }
};


// & Function to delete a address by ID
const deleteAddressById = async (id, session) => {
  try {
    const deleteAddress = await Address.findByIdAndDelete(id).session(session);
    if (!deleteAddress) {
      throw createError(404, "Address not found");
    } else {
      return { message: "Address is deleted" };
    }
  } catch (err) {
    throw err;
  }
};

module.exports = {
  createAddress,
  getAddressUsingQureystring,
  findAddressById,
  updateAddressById,
  deleteAddressById
};