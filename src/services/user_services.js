const mongoose = require("mongoose");
const User = require("../models/user");
const {
  createRole,
  deleteRoleUsingObject,
  updateRoleUsingUser,
} = require("./role_services");
const { userType, userRoleType } = require("../utils/enums");
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
    const user = await userCollection.save({ session });
    if (user) {
      const roleBody = {
        name: userType.COMPANY_ADMIN,
        user_id: user._id,
        permission: roles.companyAdmin,
      };
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
    let page = 1,
      limit = 10;
    let sortBy = "createdAt";
    
    // Build query from req.query
    for (let item in req?.query) {
      if (item === "page") {
        page = Number(req?.query?.page);
        if (isNaN(page)) page = 1;
      } else if (item === "limit") {
        limit = Number(req?.query?.limit);
        if (isNaN(limit)) limit = 10;
      } else if (item === "sortBy" && req.query.sortBy) {
        sortBy = req?.query?.sortBy;
      } else if (item === "search") {
        const regex = new RegExp(req.query.search, "i");
        query.name = { $regex: regex };
      } else if (item === "company_id" || item === "active_subscription") {
        if (mongoose.Types.ObjectId.isValid(req?.query[item])) {
          query[item] = new mongoose.Types.ObjectId(req?.query[item]);
        }
      } else {
        query[item] = req?.query[item];
      }
    }

    // Aggregate users based on the query
    const users = await User.aggregate([
      {
        $match: query
      },
      {
        $lookup: {
          from: 'companies',
          localField: '_id',
          foreignField: 'user_id',
          as: 'company'
        }
      },
      {
        // Add fields to calculate the number of companies and company members for each user
        $addFields: {
          number_of_company: {
            $cond: {
              if: { $eq: ['$company', null] },
              then: 0,
              else: {
                $size: {
                  $filter: {
                    input: '$company',  // This refers to the array of companies
                    as: 'company',
                    cond: { $ne: ['$$company', null] }
                  }
                }
              }
            }
          },
          number_of_company_members: {
            $cond: {
              if: { $eq: ['$company', null] },
              then: 0,
              else: {
                $size: {
                  $filter: {
                    input: ['$$ROOT'], // Refers to the entire document
                    as: 'all_users',
                    cond: { $eq: ['$$all_users.company_id', '$company[0]._id'] }
                  }
                }
              }
            }
          }
        }
      },
      {
        $sort: { [sortBy]: 1 }
      },
      {
        $skip: ((page - 1) * limit)
      },
      {
        $limit: limit
      },
      {
        $project: {
          name: 1,
          email: 1,
          company_position: 1,
          type: 1,
          image: 1,
          createdAt: 1,
          company: 1,
          number_of_company: 1,
          number_of_company_members: 1
        }
      }
    ]).session(session);

    // Get the total number of users for pagination
    const totalDocuments = await User.aggregate([
      {
        $match: query
      },
      {
        $lookup: {
          from: 'companies',
          localField: '_id',
          foreignField: 'user_id',
          as: 'company'
        }
      },
      {
        $unwind: {
          path: '$company',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $count: "totalDocuments"
      }
    ]).session(session);

    const totalCount = totalDocuments.length > 0 ? totalDocuments[0].totalDocuments : 0;
    const totalPage = Math.ceil(totalCount / limit);

    // Return the result with metadata and extra counts
    return {
      data: users,
      metadata: {
        totalDocuments: totalCount,
        currentPage: page,
        totalPage,
        message: "Success",
      },
    };
  } catch (err) {
    throw createError(404, "User not found");
  }
};


// & Function to get users by querystring for Reseller
const getUsersForReseller = async (req, session) => {
  try {
    const query = {};
    let page = 1,
      limit = 10;
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
      } else if (item === "sortBy" && req.query.sortBy) {
        sortBy = req?.query?.sortBy;
      } else if (item === "search") {
        const regex = new RegExp(req.query.search, "i");
        query.name = { $regex: regex };
      } else if (item === "company_id" || item === "active_subscription") {
        if (mongoose.Types.ObjectId.isValid(req?.query[item])) {
          query[item] = new mongoose.Types.ObjectId(req?.query[item]);
        }
      } else {
        query[item] = req?.query[item];
      }
    }
    const users = await User.aggregate([
      {
        $match: query
      },
      {
        $lookup: {
          from: 'companies',
          localField: '_id',
          foreignField: 'user_id',
          as: 'company'
        }
      },
      {
        $unwind: '$company'
      },
      {
        $match: {
          'company.reseller_id': new mongoose.Types.ObjectId(req.user.id)
        }
      },
      {
        $sort: { [sortBy]: 1 } // Add this line to sort by the specified field
      },
      {
        $skip: ((page - 1) * limit)
      },
      {
        $limit: limit
      },
      {
        $project: {
          name: 1,
          email: 1,
          company_position: 1,
          type: 1,
          'company._id': 1,
          'company.name': 1,
        }
      }
    ]).session(session);

    const totalDocuments = await User.aggregate([
      {
        $match: query
      },
      {
        $lookup: {
          from: 'companies',
          localField: '_id',
          foreignField: 'user_id',
          as: 'company'
        }
      },
      {
        $unwind: '$company'
      },
      {
        $match: {
          'company.reseller_id': new mongoose.Types.ObjectId(req.user.id)
        }
      },
      {
        $count: "totalDocuments"
      }
    ]).session(session);

    const totalCount = totalDocuments.length > 0 ? totalDocuments[0].totalDocuments : 0;
    const totalPage = Math.ceil(totalCount / limit);

    return {
      data: users,
      metadata: {
        totalDocuments: totalCount,
        currentPage: page,
        totalPage,
        message: "Success",
      },
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
      if (
        item == "birthdate" ||
        item === "last_subscribed" ||
        item === "expires_at"
      ) {
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

// & Function to change role of a user by ID
const changeUserRolebyId = async (id, roleName, session) => {
  try {
    const user = await findUserById(id, session);
    let permission = null,
      name = null;
    if (roleName === userType.ADMIN) {
      name = userType.ADMIN;
      permission = roles.admin;
    } else if (roleName === userType.RESELLER) {
      name = userType.RESELLER;
      permission = roles.reseller;
    } else if (roleName === userRoleType.EDITOR) {
      name = userType.USER;
      permission = roles.editor;
    } else if (roleName === userRoleType.VIEWER) {
      name = userType.USER;
      permission = roles.viewer;
    } else {
      name = userType.COMPANY_ADMIN;
      permission = roles.companyAdmin;
    }
    const role = await updateRoleUsingUser(id, { name, permission }, session);
    return role;
  } catch (err) {
    throw err;
  }
};

module.exports = {
  findUserById,
  findUserByObject,
  createUser,
  getUsers,
  getUsersForReseller,
  updateUserById,
  deleteUserById,
  changeUserRolebyId,
};
