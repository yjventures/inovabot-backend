const User = require("../models/user");
const { createError } = require("../common/error");
const { hashPassword } = require("../common/manage_pass");

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

const findUserByObject = async (body, session) => {
  try {
    const user = await User.findOne(body).session(session);
    return user;
  } catch (err) {
    throw createError();
  }
};

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

module.exports = {
  findUserById,
  findUserByObject,
  createUser,
}