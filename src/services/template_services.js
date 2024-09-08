const mongoose = require("mongoose");
const Template = require("../models/template");
const { createError } = require("../common/error");

// & Function to create a new template
const createTemplate = async (templateObj, session) => {
  try {
    const template = await new Template(templateObj).save({ session });
    return template;
  } catch (err) {
    throw err;
  }
};

// & Function to get templates using query string
const getTemplatesUsingQuerystring = async (req, session) => {
  try {
    const query = {};
    let page = 1, limit = 10, sortBy = "createdAt";
    for (let item in req?.query) {
      if (item === "page") {
        page = Number(req?.query?.page) || 1;
      } else if (item === "limit") {
        limit = Number(req?.query?.limit) || 10;
      } else if (item === "sortBy") {
        sortBy = req?.query?.sortBy;
      } else if (item === "search") {
        const regex = new RegExp(req.query.search, "i");
        query.name = { $regex: regex };
      } else if (item === "company_id") {
        query[item] = new mongoose.Types.ObjectId(req?.query[item]);
      } else {
        query[item] = req?.query[item];
      }
    }
    const templates = await Template.find(query)
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit)
      .session(session);
    const count = await Template.countDocuments(query, { session });
    return {
      data: templates,
      metadata: {
        totalDocuments: count,
        currentPage: page,
        totalPage: Math.max(1, Math.ceil(count / limit)),
      },
      message: "Success",
    };
  } catch (err) {
    throw createError(404, "Templates not found");
  }
};

// & Function to find a template by ID
const findTemplateById = async (id, session) => {
  try {
    if (!id) throw createError(400, "Id is required");
    const template = await Template.findById(id).session(session).lean();
    if (!template) throw createError(404, "Template not found");
    return template;
  } catch (err) {
    throw err;
  }
};

// & Function to update a template by ID
const updateTemplateById = async (id, body, session) => {
  try {
    const query = await findTemplateById(id, session);
    for (let item in body) {
      if (item === "company_id") {
        query[item] = new mongoose.Types.ObjectId(body[item]);
      } else {
        query[item] = body[item];
      }
    }
    const updatedTemplate = await Template.findByIdAndUpdate(id, query, {
      new: true,
      session,
    }).lean();
    if (!updatedTemplate) throw createError(400, "Template not updated");
    return { template: updatedTemplate };
  } catch (err) {
    throw err;
  }
};

// & Function to delete a template by ID
const deleteTemplateById = async (id, session) => {
  try {
    const deletedTemplate = await Template.findByIdAndDelete(id).session(session);
    if (!deletedTemplate) throw createError(404, "Template not found");
    return { message: "Template deleted" };
  } catch (err) {
    throw err;
  }
};

module.exports = {
  createTemplate,
  getTemplatesUsingQuerystring,
  findTemplateById,
  updateTemplateById,
  deleteTemplateById,
};
