const express = require('express');
const apiEnum = require('../utils/api_constant');
const passwordController = require('../controllers/password_controller');
const { process_query } = require("../middlewares/process_query");

const router = express.Router();

// ? API to request change password
router.post(apiEnum.FORGET_PASSWORD, passwordController.forgetPassword);

// ? API to verify password
router.post(apiEnum.VERIFY, passwordController.verifyPassword);

// ? API to change password
router.post(apiEnum.RESET_PASSWORD, passwordController.chnagePassword);

module.exports = router;