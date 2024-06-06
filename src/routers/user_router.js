const express = require('express');
const { body } = require("express-validator");
const apiEnum = require('../utils/api_constant');
const userController = require('../controllers/user_controller');

const router = express.Router();

// ? API to create/sighin a user
router.post(
  apiEnum.SIGNUP,
  [
    body("name", "Name is required"),
    body("email", "Please enter a valid email").notEmpty().isEmail(),
    body("password", "Please enter at least 8 digits").isLength({ min: 8 }),
  ],
  userController.create
);

// ? API to get all user using querystring
router.get(apiEnum.GET_ALL, userController.getAllUser);

// ? API to get user by ID
router.get(apiEnum.GET_BY_ID, userController.getUserByID);

// ? API to update user by ID
router.put(apiEnum.UPDATE_BY_ID, userController.updateUserByID);

module.exports = router;