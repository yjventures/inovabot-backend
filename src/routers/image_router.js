const express = require('express');
const { body } = require("express-validator");
const apiEnum = require('../utils/api_constant');
const imageController = require('../controllers/image_controller');
const { process_query } = require("../middlewares/process_query");
const { authenticateToken } = require("../middlewares/token_authenticator");

const router = express.Router();

// ? API to create an image
router.post(apiEnum.CREATE, imageController.create);

// ? API to get all images using querystring
router.get(apiEnum.GET_ALL, process_query, imageController.getAllImage);

// ? API to get image by ID
router.get(apiEnum.GET_BY_ID, imageController.getImageByID);

// ? API to update image by ID
router.put(apiEnum.UPDATE_BY_ID, authenticateToken, imageController.updateImageByID);

// ? API to delete image by ID
router.delete(apiEnum.DELETE_BY_ID, authenticateToken, imageController.deleteImageByID);

module.exports = router;