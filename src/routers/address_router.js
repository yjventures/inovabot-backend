const express = require('express');
const { body } = require("express-validator");
const apiEnum = require('../utils/api_constant');
const addressController = require('../controllers/address_controller');
const { process_query } = require("../middlewares/process_query");
const { authenticateToken } = require("../middlewares/token_authenticator");

const router = express.Router();

// ? API to create a address
router.post(apiEnum.CREATE, addressController.create);

// ? API to get all address using querystring
router.get(apiEnum.GET_ALL, process_query, addressController.getAllAddress);

// ? API to get address by ID
router.get(apiEnum.GET_BY_ID, addressController.getAddressByID);

// ? API to update address by ID
router.put(apiEnum.UPDATE_BY_ID, authenticateToken, addressController.updateAddressByID);

// ? API to delete address by ID
router.delete(apiEnum.DELETE_BY_ID, authenticateToken, addressController.deleteAddressByID);

module.exports = router;