const mongoose = require('mongoose');
const Image = require("../models/image");
const { updateBotById } = require("./bot_services");
const { runChatCompletion } = require("../utils/open_ai_utils");
const { createError } = require("../common/error");

// & Function to create a new image
const createImage = async (imageObj, session) => {
  try {
    const content = [
      {
        type: "text",
        text: "Describe the image given"
      },
      {
        type: "image_url",
        image_url: {
          url: imageObj.image_url
        }
      }
    ];
    const messageObj = await runChatCompletion(content, 'user');
    const description = messageObj.choices[0].message.content;
    const imageCollection = await new Image({...imageObj, description});
    const image = await imageCollection.save({ session });
    if (!image) {
      throw createError(400, "Image couldn't be added");
    }
    const imageList = await getAllImages(imageObj.bot_id, session);
    if (imageList && imageList.length > 0) {
      const bot = await updateBotById(image.bot_id, { images: imageList }, session);
      return imageList;
    } else {
      throw createError(400, "Image couldn't found");
    }
  } catch (err) {
    throw err;
  }
};

// & Function to get images using querystring
const getImageUsingQureystring = async (req, session) => {
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
      } else if (item === "bot_id") {
        query[item] = new mongoose.Types.ObjectId(req?.query[item]);
      } 
      else {
        query[item] = req?.query[item];
      }
    }
    const images = await Image.find(query)
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit)
      .session(session);
    const count = await Image.countDocuments(query, {session});
    return {
      data: images,
      metadata: {
        totalDocuments: count,
        currentPage: page,
        totalPage: Math.max(1, Math.ceil(count / limit)),
      },
      message: "Success",
    };
  } catch (err) {
    throw createError(404, "Image not found"); 
  }
};

// & Function to find an image by ID
const findImageById = async (id, session) => {
  try {
    if (!id) {
      throw createError(400, "Id need to be provided");
    }
    const image = await Image.findById(id).session(session).lean();
    if (image) {
      return image;
    } else {
      throw createError(404, "Image not found");
    }
  } catch (err) {
    throw err;
  }
};

// & Function to update an image by ID
const updateImageById = async (id, body, session) => {
  try {
    const query = await findImageById(id, session);
    for (let item in body) {
      if (item === "bot_id") {
        query[item] = new mongoose.Types.ObjectId(body[item]);
      } else {
        query[item] = body[item];
      }
    }
    const updateImage = await Image.findByIdAndUpdate(id, query, { new: true, session }).lean();
    if (!updateImage) {
      throw createError(400, "Image not updated");
    } else {
      const images = await getAllImages(updateImage.bot_id, session);
      const bot = await updateBotById(updateImage.bot_id, { images }, session);
      return { image: updateImage };
    }
  } catch (err) {
    throw err;
  }
};


// & Function to delete an image by ID
const deleteImageById = async (id, session) => {
  try {
    const deleteImage = await Image.findByIdAndDelete(id).session(session);
    if (!deleteImage) {
      throw createError(404, "Image not found");
    } else {
      const images = await getAllImages(deleteImage.bot_id, session);
      const bot = await updateBotById(deleteImage.bot_id, { images }, session);
      return { message: "Image is deleted" };
    }
  } catch (err) {
    throw err;
  }
};

// & Function to get all images
const getAllImages = async (bot_id, session) => {
  try {
    const images = await Image.find({ bot_id }).session(session).lean();
    if (!images) {
      throw createError(404, "Images not found");
    } else {
      return images;
    }
  } catch (err) {
    throw err;
  }
};

module.exports = {
  createImage,
  getImageUsingQureystring,
  findImageById,
  updateImageById,
  deleteImageById,
  getAllImages,
};