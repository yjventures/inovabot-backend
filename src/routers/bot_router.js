const express = require('express');
const { body } = require("express-validator");
const apiEnum = require('../utils/api_constant');
const botController = require('../controllers/bot_controller');
const { process_query } = require("../middlewares/process_query");
const { authenticateToken } = require("../middlewares/token_authenticator");

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
  botController.create
);

// ? API to get bots using querystring
router.get(apiEnum.GET_ALL, process_query, botController.getAll);

// ? API to get a bot using ID
router.get(apiEnum.GET_BY_ID, botController.getBotByID);

// ? API to update a bot using ID
router.put(apiEnum.UPDATE_BY_ID, authenticateToken, botController.updateBotByID);

// ? API to delete a bot by ID
router.delete(apiEnum.DELETE_BY_ID, authenticateToken, botController.deleteBotByID);

module.exports = router;