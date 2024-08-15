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
      const user_id = req?.user?.id;
      if (!user_id) {
        throw createError(404, "User not found");
      }
      if (req?.user?.type === userType.RESELLER) {
        req.query.reseller_id = user_id;
      }
      if (req?.user?.type === userType.COMPANY_ADMIN) {
        req.query.user_id = user_id;
      }
      const companyObj = {};
      for (let item in req?.body) {
        if (
          item === "user_id" ||
          item === "reseller_id" ||
          item === "package"
        ) {
          companyObj[item] = new mongoose.Types.ObjectId(req.body[item]);
        } else {
          companyObj[item] = req.body[item];
        }
      }
      companyObj.user_id = req.user.id;
      const company = await createCompany(companyObj, session);
      if (company) {
        await session.commitTransaction();
        session.endSession();
        res.status(200).json({ message: "successfull", company });
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
    const user_id = req?.user?.id;
    if (!user_id) {
      throw createError(404, "User not found");
    }
    if (req?.user?.type === userType.RESELLER) {
      req.query.reseller_id = user_id;
    }
    if (req?.user?.type === userType.COMPANY_ADMIN) {
      req.query.user_id = user_id;
    }
    const result = await getCompanyUsingQureystring(req, session);
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
    const user_id = req?.user?.id;
    if (!user_id) {
      throw createError(404, "User not found");
    }
    const id = req?.params?.id;
    const company = await findCompanyById(id, session);
    if (!company) {
      throw createError(404, "User not found");
    }
    if (
      req?.user?.type === userType.RESELLER &&
      company?.reseller_id.toString() !== user_id.toString()
    ) {
      throw createError(400, "Not authorized");
    }
    if (
      req?.user?.type === userType.COMPANY_ADMIN &&
      company?.user_id.toString() !== user_id.toString()
    ) {
      throw createError(400, "Not authorized");
    }
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
    const user_id = req?.user?.id;
    const id = req?.params?.id;
    if (!id) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "Id not provided"));
    }
    if (!user_id) {
      throw createError(404, "User not found");
    }
    const company = await findCompanyById(id, session);
    if (
      req?.user?.type === userType.RESELLER &&
      company?.reseller_id.toString() !== user_id.toString()
    ) {
      throw createError(400, "Not authorized");
    }
    if (
      req?.user?.type === userType.COMPANY_ADMIN &&
      company?.user_id.toString() !== user_id.toString()
    ) {
      throw createError(400, "Not authorized");
    }
    if (req?.body) {
      const company = await updateCompanyById(id, req.body, session);
      await session.commitTransaction();
      session.endSession();
      res.status(200).json(company);
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
    const user_id = req?.user?.id;
    const id = req?.params?.id;
    if (!id) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "Not provide id"));
    }
    if (!user_id) {
      throw createError(404, "User not found");
    }
    const company = await findCompanyById(id, session);
    if (
      req?.user?.type === userType.RESELLER &&
      company?.reseller_id.toString() !== user_id.toString()
    ) {
      throw createError(400, "Not authorized");
    }
    if (
      req?.user?.type === userType.COMPANY_ADMIN &&
      company?.user_id.toString() !== user_id.toString()
    ) {
      throw createError(400, "Not authorized");
    }
    const message = await deleteCompanyById(id, session);
    await session.commitTransaction();
    session.endSession();
    res.status(200).json(message);
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
};
