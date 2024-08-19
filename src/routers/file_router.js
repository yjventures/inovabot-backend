const express = require("express");
const apiEnum = require("../utils/api_constant");
const fileController = require("../controllers/file_controller");
const { process_query } = require("../middlewares/process_query");
const { authenticateToken } = require("../middlewares/token_authenticator");

const router = express.Router();

// ? API to get all files using querystring
router.get(apiEnum.GET_ALL, process_query, fileController.getAllFiles);

// ? API to get file by ID
router.get(apiEnum.GET_BY_ID, authenticateToken, fileController.getFileById);

module.exports = router;