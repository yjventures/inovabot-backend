const mongoose = require('mongoose');
const Link = require("../models/link");
const { updateBotById } = require("./bot_services");
const { createError } = require("../common/error");

// & Function to create a new link
const createLink = async (linkObj, session) => {
  try {
    const linkCollection = await new Link(linkObj);
    const link = await linkCollection.save({ session });
    if (link) {
      const links = await getAllLinks(linkObj.bot_id, session);
      const bot = await updateBotById(linkObj.bot_id, { links }, session);
      return link;
    } else {
      throw createError(400, "Link couldn't found");
    }
  } catch (err) {
    throw err;
  }
};

// & Function to get links using querystring
const getLinkUsingQureystring = async (req, session) => {
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
      } else if (item === "search") {
        const regex = new RegExp(req.query.search, "i");
        query.name = { $regex: regex };
      } else if (item === "sortBy") {
        sortBy = req?.query?.sortBy;
      } else {
        query[item] = req?.query[item];
      }
    }
    const links = await Link.find(query)
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit)
      .session(session);
    const count = await Link.countDocuments(query, {session});
    return {
      data: links,
      metadata: {
        totalDocuments: count,
        currentPage: page,
        totalPage: Math.max(1, Math.ceil(count / limit)),
      },
      message: "Success",
    };
  } catch (err) {
    throw createError(404, "Link not found"); 
  }
};

// & Function to find a link by ID
const findLinkById = async (id, session) => {
  try {
    if (!id) {
      throw createError(400, "Id need to be provided");
    }
    const link = await Link.findById(id).session(session).lean();
    if (link) {
      return link;
    } else {
      throw createError(404, "Link not found");
    }
  } catch (err) {
    throw err;
  }
};

// & Function to update a link by ID
const updateLinkById = async (id, body, session) => {
  try {
    const query = await findLinkById(id, session);
    for (let item in body) {
      if (item === "bot_id") {
        query[item] = new mongoose.Types.ObjectId(body[item]);
      } else {
        query[item] = body[item];
      }
    }
    const updateLink = await Link.findByIdAndUpdate(id, query, { new: true, session }).lean();
    if (!updateLink) {
      throw createError(400, "Link not updated");
    } else {
      const links = await getAllLinks(updateLink.bot_id, session);
      const bot = await updateBotById(updateLink.bot_id, { links }, session);
      return { link: updateLink };
    }
  } catch (err) {
    throw err;
  }
};


// & Function to delete a link by ID
const deleteLinkById = async (id, session) => {
  try {
    const deleteLink = await Link.findByIdAndDelete(id).session(session);
    if (!deleteLink) {
      throw createError(404, "Link not found");
    } else {
      const links = await getAllLinks(deleteLink.bot_id, session);
      const bot = await updateBotById(deleteLink.bot_id, { links }, session);
      return { message: "Link is deleted" };
    }
  } catch (err) {
    throw err;
  }
};

// & Function to get all links
const getAllLinks = async (bot_id, session) => {
  try {
    const links = await Link.find({ bot_id }).session(session).lean();
    if (!links) {
      throw createError(404, "Links not found");
    } else {
      return links;
    }
  } catch (err) {
    throw err;
  }
};

module.exports = {
  createLink,
  getLinkUsingQureystring,
  findLinkById,
  updateLinkById,
  deleteLinkById,
  getAllLinks,
};