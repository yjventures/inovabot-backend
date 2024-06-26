const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const {
  createCompany,
  getCompanyUsingQureystring,
  findCompanyById,
  updateCompanyById,
  deleteCompanyById,
} = require("../services/company_services");
const { userType } = require("../utils/enums");
const { createError } = require("../common/error");

// * Function to create a company
const create = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, errors));
    } else {
      const companyObj = {};
      for (let item in req?.body) {
        companyObj[item] = req.body[item];
      }
      const company = await createCompany(companyObj, session);
      if (company) {
        await session.commitTransaction();
        session.endSession();
        res
          .status(200)
          .json({ message: "successfull", company });
      } else {
        await session.abortTransaction();
        session.endSession();
        return next(createError(503, "Something went wrong"));
      }
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to get all the companies using querystring
const getAllCompany = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await getCompanyUsingQureystring(req?.body, session);
    if (result) {
      await session.commitTransaction();
      session.endSession();
      res.status(200).json(result);
    } else {
      await session.abortTransaction();
      session.endSession();
      return next(createError(404, "Gives the error"));
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to get a company by ID
const getCompanyByID = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const id = req?.params?.id;
    const company = await findCompanyById(id, session);
    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ company });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to update a company by ID
const updateCompanyByID = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const id = req?.params?.id;
    if (!id) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "Id not provided"))
    }
    if (req?.body) {
      const user = await updateCompanyById(id, req.body, session);
      await session.commitTransaction();
      session.endSession();
      res.status(200).json(user);
    } else {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "No body provided"));
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to delete a company by ID
const deleteCompanyByID = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const id = req?.params?.id;
    if (!id) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "Not provide id"));
    } else if (
      req.user.type !== userType.ADMIN
    ) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "You have to be admin or super admin to delete"));
    } else {
      const message = await deleteCompanyById(id, session);
      await session.commitTransaction();
      session.endSession();
      res.json(200).json(message);
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

module.exports = {
  create,
  getAllCompany,
  getCompanyByID,
  updateCompanyByID,
  deleteCompanyByID,
}