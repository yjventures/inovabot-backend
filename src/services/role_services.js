const Role = require('../models/role');
const { createError } = require('../common/error');

// & Function to find a role using user_id
const findRoleByUserId = async (user_id) => {
  try {
     const role = await Role.findOne({ user_id }).lean();
     if (!role) {
      throw createError(404, 'Role not found`');
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
      throw createError(400, 'Role not created');
    }
    return role;
  } catch (err) {
    throw err;
  }
};

module.exports = {
  findRoleByUserId,
  createRole,
};