const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const {
  createTemplate,
  getTemplatesUsingQuerystring,
  findTemplateById,
  updateTemplateById,
  deleteTemplateById,
} = require("../services/template_services");
const { createError } = require("../common/error");

// * Function to create a template
const create = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, errors));
    }
    
    const templateObj = { ...req.body, company_id: req.body.company_id ? new mongoose.Types.ObjectId(req.body.company_id) : null };
    const template = await createTemplate(templateObj, session);
    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ message: "Template created successfully", template });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to get all templates using querystring
const getAllTemplates = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await getTemplatesUsingQuerystring(req, session);
    await session.commitTransaction();
    session.endSession();
    res.status(200).json(result);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to get a template by ID
const getTemplateByID = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const id = req.params.id;
    const template = await findTemplateById(id, session);
    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ template });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to update a template by ID
const updateTemplateByID = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const id = req.params.id;
    const updatedTemplate = await updateTemplateById(id, req.body, session);
    await session.commitTransaction();
    session.endSession();
    res.status(200).json(updatedTemplate);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

// * Function to delete a template by ID
const deleteTemplateByID = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const id = req.params.id;
    const message = await deleteTemplateById(id, session);
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
  getAllTemplates,
  getTemplateByID,
  updateTemplateByID,
  deleteTemplateByID,
};
