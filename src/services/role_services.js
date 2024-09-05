const Role = require("../models/role");
const { createError } = require("../common/error");

// & Function to find a role using user_id
const findRoleByUserId = async (user_id) => {
  try {
    const role = await Role.findOne({ user_id }).lean();
    if (!role) {
      throw createError(404, "Role not found`");
    }
    return role;
  } catch (err) {
    throw err;
  }
};

// & Function to create a role
const createRole = async (body, session) => {
  try {
    const roleCollection = await new Role(body);
    const role = await roleCollection.save({ session });
    if (!role) {
      throw createError(400, "Role not created");
    }
    return role;
  } catch (err) {
    throw err;
  }
};

// & Function to delete a role by user id
const deleteRoleUsingObject = async (user_id, session) => {
  try {
    const role = await Role.findOneAndDelete({ user_id })
      .session(session)
      .lean();
    if (!role) {
      throw createError(404, "Role not found");
    }
    return role;
  } catch (err) {
    throw err;
  }
};

// & Function to update a role by user id
const updateRoleUsingUser = async (user_id, object, session) => {
  try {
    const role = await Role.findOneAndUpdate({ user_id }, object, { new: true })
      .session(session)
      .lean();
    if (!role) {
      throw createError(404, "Role not found");
    }
    return role;
  } catch (err) {
    throw err;
  }
};

module.exports = {
  findRoleByUserId,
  createRole,
  deleteRoleUsingObject,
  updateRoleUsingUser,
};
