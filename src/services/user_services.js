const User = require("../models/user");
const { createError } = require("../common/error");
const { hashPassword } = require("../common/manage_pass");

// & Function to find user by ID
const findUserById = async (id, session) => {
  try {
    const user = await User.findById(id).lean().session(session);
    if (user) {
      return user;
    } else {
      throw createError(404, "User not found");
    }
  } catch (err) {
    throw err;
  }
};

// & Function to find user using body
const findUserByObject = async (body, session) => {
  try {
    const user = await User.findOne(body).session(session);
    return user;
  } catch (err) {
    throw createError();
  }
};

// & Function to create a new user
const createUser = async (userBody, password, session) => {
  try {
    const hash = await hashPassword(password);
    userBody.password = hash;
    const userCollection = await new User(userBody);
    const user = await userCollection.save({session});
    return user;
  } catch (err) {
    throw err;
  }
};

// & Function to get users by querystring
const getUsers = async (req, session) => {
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
    const users = await User.find(query)
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit)
      .session(session);
    const count = await User.countDocuments(query);
    return { users, total: count };
  } catch (err) {
    next(err);
  }
}

module.exports = {
  findUserById,
  findUserByObject,
  createUser,
  getUsers,
}