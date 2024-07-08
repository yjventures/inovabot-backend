const express = require('express');
const apiEnum = require('../utils/api_constant');
const threadController = require('../controllers/thread_controller');
const { authenticateToken } = require("../middlewares/token_authenticator");

const router = express.Router();

// ? API to get thread by ID
router.post(apiEnum.GET_THREAD, threadController.getThreadByID);

// ? API to get message list by ID
router.get(apiEnum.GET_MESSAGE_LIST_BY_ID, threadController.getMessageListByID);

// ? API to run thread by ID
router.post(apiEnum.RUN_THREAD_BY_ID, threadController.runThreadByID);

module.exports = router;