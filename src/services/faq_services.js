const mongoose = require('mongoose');
const Faq = require("../models/faq");
const { createError } = require("../common/error");

// & Function to create a new faq
const createFaq = async (faqObj, session) => {
  try {
    const faqCollection = await new Faq(faqObj);
    const faq = await faqCollection.save({ session });
    if (faq) {
      return faq;
    } else {
      throw createError(400, "Faq couldn't found");
    }
  } catch (err) {
    throw err;
  }
};

// & Function to get faqs using querystring
const getFaqUsingQureystring = async (req, session) => {
  try {
    const query = {};
    for (let item in req?.query) {
      if (item === "bot_id") {
        query[item] = new mongoose.Types.ObjectId(req?.query[item]);
      } else {
        query[item] = req?.query[item];
      }
    }
    const faqs = await Faq.find(query).session(session);
    const count = await Faq.countDocuments(query, {session});
    return {
      data: faqs,
      metadata: {
        totalDocuments: count,
      },
      message: "Success",
    };
  } catch (err) {
    throw createError(404, "Faq not found"); 
  }
};

// & Function to find a faq by ID
const findFaqById = async (id, session) => {
  try {
    if (!id) {
      throw createError(400, "Id need to be provided");
    }
    const faq = await Faq.findById(id).session(session).lean();
    if (faq) {
      return faq;
    } else {
      throw createError(404, "Faq not found");
    }
  } catch (err) {
    throw err;
  }
};

// & Function to update a faq by ID
const updateFaqById = async (id, body, session) => {
  try {
    const query = await findFaqById(id, session);
    for (let item in body) {
      if (item === "bot_id") {
        query[item] = new mongoose.Types.ObjectId(body[item]);
      } else {
        query[item] = body[item];
      }
    }
    const updateFaq = await Faq.findByIdAndUpdate(id, query, { new: true, session }).lean();
    if (!updateFaq) {
      throw createError(400, "Faq not updated");
    } else {
      return { faq: updateFaq };
    }
  } catch (err) {
    throw err;
  }
};

// & Function to delete a faq by ID
const deleteFaqById = async (id, session) => {
  try {
    const deleteFaq = await Faq.findByIdAndDelete(id).session(session);
    if (!deleteFaq) {
      throw createError(404, "Faq not found");
    } else {
      return { message: "Faq is deleted" };
    }
  } catch (err) {
    throw err;
  }
};

module.exports = {
  createFaq,
  getFaqUsingQureystring,
  findFaqById,
  updateFaqById,
  deleteFaqById
};