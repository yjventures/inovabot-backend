const User = require("../models/user");
const {
  createRole,
  deleteRoleUsingObject,
} = require("./role_services");
const { userType } = require("../utils/enums");
const roles = require("../utils/roles");
const { createError } = require("../common/error");
const { hashPassword } = require("../common/manage_pass");

// & Function to find user by ID
const findUserById = async (id, session) => {
  try {
    const user = await User.findById(id).session(session).lean();
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
    const user = await User.findOne(body).session(session).lean();
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
    if (user) {
      const roleBody = {
        name: userType.COMPANY_ADMIN,
        user_id: user._id,
        permission: roles.companyAdmin,
      }
      const role = await createRole(roleBody, session);
      if (!role) {
        throw createError(400, "Role not assigned");
      }
      return user;
    } else {
      throw createError(400, "User not created");
    }
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
    const count = await User.countDocuments(query, {session});
    return {
      data: users,
      metadata: {
        totalDocuments: count,
        currentPage: page,
        totalPage: Math.max(1, Math.ceil(count / limit)),
      },
      message: "Success",
    };
  } catch (err) {
    throw createError(404, "User not found");
  }
};

// & Function to update a user by ID
const updateUserById = async (id, body, session) => {
  try {
    const query = await findUserById(id, session);
    for (let item in body) {
      if (item == "birthdate" || item === "last_subscribed" || item === "expires_at") {
        if (body[item]) {
          const bday = body?.birthdate;
          query.birthdate = new Date(bday);
        }
      } else {
        query[item] = body[item];
      }
    }
    const updateUser = await User.findByIdAndUpdate(id, query, {
      new: true,
      session,
    }).lean();
    if (!updateUser) {
      throw createError(400, "User not updated");
    } else {
      return { user: updateUser, message: "success" };
    }
  } catch (err) {
    throw err;
  }
};

// & Function to delete a user by ID
const deleteUserById = async (id, session) => {
  try {
    const deleteUser = await User.findByIdAndDelete(id).session(session);
    if (!deleteUser) {
      throw createError(404, "User not found");
    } else {
      const role = await deleteRoleUsingObject(id);
      return { message: "User is deleted" };
    }
  } catch (err) {
    throw err;
  }
};

module.exports = {
  findUserById,
  findUserByObject,
  createUser,
  getUsers,
  updateUserById,
  deleteUserById,
}