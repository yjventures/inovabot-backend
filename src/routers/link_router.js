const express = require('express');
const { body } = require("express-validator");
const apiEnum = require('../utils/api_constant');
const linkController = require('../controllers/link_controller');
const { process_query } = require("../middlewares/process_query");
const { authenticateToken } = require("../middlewares/token_authenticator");

const router = express.Router();

// ? API to create a link
router.post(apiEnum.CREATE, linkController.create);

// ? API to get all link using querystring
router.get(apiEnum.GET_ALL, process_query, linkController.getAllLink);

// ? API to get link by ID
router.get(apiEnum.GET_BY_ID, linkController.getLinkByID);

// ? API to update link by ID
router.put(apiEnum.UPDATE_BY_ID, authenticateToken, linkController.updateLinkByID);

// ? API to delete link by ID
router.delete(apiEnum.DELETE_BY_ID, authenticateToken, linkController.deleteLinkByID);

module.exports = router;