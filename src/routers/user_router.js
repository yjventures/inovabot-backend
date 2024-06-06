const express = require('express');
const { body } = require("express-validator");
const apiEnum = require('../utils/api_constant');
const userController = require('../controllers/user_controller');

const router = express.Router();

// ? API to login a user
router.post(
  apiEnum.SIGNUP,
  [
    body("name", "Name is required"),
    body("email", "Please enter a valid email").notEmpty().isEmail(),
    body("password", "Please enter at least 8 digits").isLength({ min: 8 }),
  ],
  userController.create
);

module.exports = router;