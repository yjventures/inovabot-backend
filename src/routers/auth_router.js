const express = require('express');
const apiEnum = require('../utils/api_constant');
const authController = require('../controllers/auth_controller');

const router = express.Router();

// ? API to login a user
router.post(apiEnum.LOGIN, authController.login);

module.exports = router;