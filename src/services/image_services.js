const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Image = require("../models/image");
const { updateBotById } = require("./bot_services");
const {
  runChatCompletion,
  addFileInVectorStore,
  deleteFileInVectorStore,
} = require("../utils/open_ai_utils");
const { createError } = require("../common/error");
const { findBotById } = require("./bot_services");
require("dotenv").config();

// & Function to create a new image
const createImage = async (imageObj, session) => {
  let file = "";
  try {
    const randomNumber = Math.floor(Math.random() * 10000000);
    const fileLocation = process.env.BULK_FILE_LOCATION;
    const filePath = path.join(fileLocation, `/image_urls_${randomNumber}.txt`);
    if (!fs.existsSync(fileLocation)) {
      fs.mkdirSync(fileLocation, { recursive: true });
    }
    fs.writeFileSync(
      filePath,
      `Show this images for this objective: ${imageObj.objective}\n`,
      (err) => {
        if (err) throw err;
      }
    );
    file = filePath;
    for (let url of imageObj.image_url) {
      let content = [
        {
          type: "text",
          text: "Describe the image given",
        },
        {
          type: "image_url",
          image_url: {
            url: url,
          },
        },
      ];
      let messageObj = await runChatCompletion(content, "user");
      let description = messageObj.choices[0].message.content;

      fs.appendFileSync(
        filePath,
        `Image: ${url}\nDescription: ${description}\n\n`,
        (err) => {
          if (err) throw err;
        }
      );
    }

    const bot = await findBotById(imageObj.bot_id.toString(), session);

    const fileObj = await addFileInVectorStore(bot.vector_store_id, filePath);

    const imageCollection = await new Image({ ...imageObj, file_id: fileObj.id });
    const image = await imageCollection.save({ session });
    if (!image) {
      throw createError(400, "Image couldn't be added");
    }
    fs.unlinkSync(file);
    const imageList = await getAllImages(imageObj.bot_id, session);
    if (imageList && imageList.length > 0) {
      return imageList;
    } else {
      throw createError(400, "Image couldn't found");
    }
  } catch (err) {
    fs.unlinkSync(file);
    throw err;
  }
};

// & Function to get images using querystring
const getImageUsingQureystring = async (req, session) => {
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
      } else if (item === "search") {
        const regex = new RegExp(req.query.search, "i");
        query.name = { $regex: regex };
      } else if (item === "sortBy") {
        sortBy = req?.query?.sortBy;
      } else if (item === "bot_id") {
        query[item] = new mongoose.Types.ObjectId(req?.query[item]);
      } else {
        query[item] = req?.query[item];
      }
    }
    const images = await Image.find(query)
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit)
      .session(session);
    const count = await Image.countDocuments(query, { session });
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
    const updateImage = await Image.findByIdAndUpdate(id, query, {
      new: true,
      session,
    }).lean();
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
    const deleteImage = await Image.findByIdAndDelete(id).session(session).lean();
    if (!deleteImage) {
      throw createError(404, "Image not found");
    } else {
      const bot = await findBotById(deleteImage.bot_id.toString(), session);
      await deleteFileInVectorStore(bot.vector_store_id, deleteImage.file_id);
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
