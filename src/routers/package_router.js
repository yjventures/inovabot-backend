const express = require('express');
const { body } = require("express-validator");
const apiEnum = require('../utils/api_constant');
const packageController = require('../controllers/package_controller');
const { process_query } = require("../middlewares/process_query");
const { authenticateToken } = require("../middlewares/token_authenticator");

const router = express.Router();

// ? API to create a package
router.post(apiEnum.CREATE, packageController.create);

// ? API to get all package using querystring
router.get(apiEnum.GET_ALL, process_query, packageController.getAllPackage);

// ? API to get package by ID
router.get(apiEnum.GET_BY_ID, packageController.getPackageByID);

// ? API to update package by ID
router.put(apiEnum.UPDATE_BY_ID, authenticateToken, packageController.updatePackageByID);

// ? API to delete package by ID
router.delete(apiEnum.DELETE_BY_ID, authenticateToken, packageController.deletePackageByID);

module.exports = router;