const express = require("express");
const { body } = require("express-validator");
const apiEnum = require("../utils/api_constant");
const botController = require("../controllers/bot_controller");
const { process_query } = require("../middlewares/process_query");
const { authenticateToken } = require("../middlewares/token_authenticator");
const { packageFeature } = require("../middlewares/package_feature");
const { setPathForUploader } = require("../middlewares/file_uploader");
const { serviceName } = require("../utils/enums");
const { isPermitted } = require("../middlewares/role_based_permission");

const upload = setPathForUploader();
const router = express.Router();

// ? API to create a bot/assistant
router.post(
  apiEnum.CREATE,
  [
    body("name", "Name is required"),
    body("model", "Name is required"),
    body("user_id", "User ID is required"),
    body("company_id", "Company ID is required"),
  ],
  authenticateToken,
  isPermitted(serviceName.BOT_SERVICE, apiEnum.CREATE),
  botController.create
);

// ? API to get bots using querystring
router.get(
  apiEnum.GET_ALL,
  process_query,
  authenticateToken,
  isPermitted(serviceName.BOT_SERVICE, apiEnum.GET_ALL),
  botController.getAll
);

// ? API to get a bot using ID
router.get(apiEnum.GET_BY_ID, botController.getBotByID);

// ? API to update a bot using ID
router.put(
  apiEnum.UPDATE_BY_ID,
  authenticateToken,
  isPermitted(serviceName.BOT_SERVICE, apiEnum.UPDATE_BY_ID),
  botController.updateBotByID
);

// ? API to delete a bot by ID
router.delete(
  apiEnum.DELETE_BY_ID,
  authenticateToken,
  isPermitted(serviceName.BOT_SERVICE, apiEnum.DELETE_BY_ID),
  botController.deleteBotByID
);

// ? API to upload a file to a bot
router.post(
  apiEnum.UPLOAD,
  authenticateToken,
  upload.single("file"),
  isPermitted(serviceName.BOT_SERVICE, apiEnum.UPLOAD),
  packageFeature,
  botController.uploadFileToBot
);

// ? API to delete a file from a bot
router.post(
  apiEnum.DELETE_FILE,
  authenticateToken,
  isPermitted(serviceName.BOT_SERVICE, apiEnum.DELETE_FILE),
  botController.deleteFileFromBotByID
);

module.exports = router;
