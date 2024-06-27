const mongoose = require('mongoose');
const Company = require("../models/company");
const { createError } = require("../common/error");

// & Function to create a new company
const createCompany = async (companyObj, session) => {
  try {
    const companyCollection = await new Company(companyObj);
    const company = await companyCollection.save({ session });
    if (company) {
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
    const companies = await Company.find(query)
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit)
      .session(session);
    const count = await Company.countDocuments(query, {session});
    return { companies, total: count };
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
      throw createError(404, "Company not found");
    }
  } catch (err) {
    throw err;
  }
};

// & Function to update a company by ID
const updateCompanyById = async (id, body, session) => {
  try {
    const query = await findCompanyById(id, session);
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
    const updateCompany = await Company.findByIdAndUpdate(id, query, { new: true, session }).lean();
    if (!updateCompany) {
      throw createError(400, "Company not updated");
    } else {
      return { company: updateCompany };
    }
  } catch (err) {
    throw err;
  }
};


// & Function to delete a company by ID
const deleteCompanyById = async (id, session) => {
  try {
    const deleteCompany = await Company.findByIdAndDelete(id).session(session);
    if (!deleteCompany) {
      throw createError(404, "Company not found");
    } else {
      return { message: "Company is deleted" };
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
  deleteCompanyById
};