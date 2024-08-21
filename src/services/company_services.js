const mongoose = require("mongoose");
const Company = require("../models/company");
const { createError } = require("../common/error");
const { createStripeCustomer } = require("../utils/stripe_utils");
const { findUserById, updateUserById } = require("../services/user_services");
const { employeeType } = require("../utils/enums");

// & Function to create a new company
const createCompany = async (companyObj, session) => {
  try {
    const user = await findUserById(companyObj.user_id, session);
    const customer = await createStripeCustomer(user.email);
    companyObj.stripe_customer_id = customer.id;

    const companyCollection = await new Company(companyObj);
    const company = await companyCollection.save({ session });
    if (company) {
      const newUser = await updateUserById(
        user?._id,
        {
          company_id: company._id,
          company_position: employeeType.ADMIN,
          has_company: true,
        },
        session
      );
      if (!newUser) {
        throw createError(500, "Error while updating user");
      }
      return company;
    } else {
      throw createError(400, "Company couldn't found");
    }
  } catch (err) {
    throw err;
  }
};

// & Function to get companies using querystring
const getCompanyUsingQureystring = async (req, session) => {
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
      } else if (item === "sortBy") {
        sortBy = req?.query?.sortBy;
      } else if (item === "search") {
        const regex = new RegExp(req.query.search, "i");
        query.name = { $regex: regex };
      } else {
        query[item] = req?.query[item];
      }
    }
    const companies = await Company.find(query)
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit)
      .session(session);
    const count = await Company.countDocuments(query, { session });
    return {
      data: companies,
      metadata: {
        totalDocuments: count,
        currentPage: page,
        totalPage: Math.max(1, Math.ceil(count / limit)),
      },
      message: "Success",
    };
  } catch (err) {
    throw createError(404, "Company not found");
  }
};

// & Function to get company without query string
const getCompanyListWithoutQuery = async (req, session) => {
  try {
    const query = {};
    for (let item in req?.query) {
      query[item] = req?.query[item];
    }
    const companies = await Company.find(query).session(session);
    const count = await Company.countDocuments(query, { session });
    return {
      data: companies,
      metadata: {
        totalDocuments: count,
      },
      message: "Success",
    };
  } catch (err) {
    throw createError(404, "Company not found");
  }
};

// & Function to find a company by ID
const findCompanyById = async (id, session) => {
  try {
    if (!id) {
      throw createError(400, "Id need to be provided");
    }
    const company = await Company.findById(id).session(session).lean();
    if (company) {
      return company;
    } else {
      return null;
    }
  } catch (err) {
    throw err;
  }
};

// & Function to update a company by ID
const updateCompanyById = async (id, body, session) => {
  try {
    const query = await findCompanyById(id, session);
    if (!query) {
      throw createError(404, "Company not found");
    }
    for (let item in body) {
      if (
        (item === "recurring_date" ||
          item === "last_subscribed" ||
          item === "expires_at") &&
        body[item]
      ) {
        const date = new Date(body[item]);
        query[item] = date;
      } else if (item === "user_id" || item === "package") {
        if (mongoose.Types.ObjectId.isValid(body[item])) { // Validate ObjectId
          query[item] = new mongoose.Types.ObjectId(body[item]);
        } else {
          throw createError(400, `${item} is not a valid ObjectId`);
        }
      } else {
        query[item] = body[item];
      }
    }
    const updateCompany = await Company.findByIdAndUpdate(id, query, {
      new: true,
      session,
    }).lean();
    if (!updateCompany) {
      throw createError(400, "Company not updated");
    } else {
      return { company: updateCompany };
    }
  } catch (err) {
    throw err;
  }
};

// & Function to increment value of property in company
const incrementInCompany = async (id, property, value, session) => {
  try {
    const company = await Company.findByIdAndUpdate(
      id,
      { $inc: { [property]: value } },
      {
        new: true,
        session,
      }
    ).lean();
    return company;
  } catch (err) {
    throw err;
  }
};

// & Function to delete a company by ID
const deleteCompanyById = async (id, session) => {
  try {
    const deleteCompany = await Company.findByIdAndDelete(id)
      .session(session)
      .lean();
    if (!deleteCompany) {
      throw createError(404, "Company not found");
    } else {
      return { message: "Company is deleted" };
    }
  } catch (err) {
    throw err;
  }
};

// & Function to find company by object
const findCompanyByObject = async (object, session) => {
  try {
    const company = await Company.findOne(object).session(session).lean();
    if (company) {
      return company;
    } else {
      return null;
    }
  } catch (err) {
    throw err;
  }
};

module.exports = {
  createCompany,
  getCompanyUsingQureystring,
  findCompanyById,
  updateCompanyById,
  deleteCompanyById,
  findCompanyByObject,
  incrementInCompany,
  getCompanyListWithoutQuery,
};
