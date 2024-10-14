const express = require('express');
const apiEnum = require('../utils/api_constant');
const threadController = require('../controllers/thread_controller');
const { process_query } = require("../middlewares/process_query");
const { setPathForUploader } = require("../middlewares/file_uploader");

const router = express.Router();
const upload = setPathForUploader();

// ? API to get thread by ID
router.post(apiEnum.GET_THREAD, threadController.getThreadByID);

// ? API to get message list by ID
router.get(apiEnum.GET_MESSAGE_LIST_BY_ID, threadController.getMessageListByID);

// ? API to run thread by ID
router.post(apiEnum.RUN_THREAD_BY_ID, threadController.runThreadByID);

// ? API to stop run by id
router.post(apiEnum.STOP_THREAD, threadController.stopRunById);

// ? API to upload a file to a thread
router.post(
  apiEnum.UPLOAD,
  upload.single("file"),
  threadController.uploadFileToThread
);

// ? API to delete a file from a thread
router.post(apiEnum.DELETE_FILE, threadController.deleteFileFromThreadByID);

// ? API to get all thread using querystring
router.get(
  apiEnum.GET_ALL,
  process_query,
  threadController.getAllThread
);

// ? API to update thread by ID
router.put(
  apiEnum.UPDATE_BY_ID,
  threadController.updateThreadByID
);

module.exports = router;