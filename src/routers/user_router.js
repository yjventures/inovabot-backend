const express = require("express");
const { body } = require("express-validator");
const apiEnum = require("../utils/api_constant");
const userController = require("../controllers/user_controller");
const { process_query } = require("../middlewares/process_query");
const { authenticateToken } = require("../middlewares/token_authenticator");
const multer = require("multer");
const uploadImage = require("../utils/upload_utils");
const { serviceName } = require("../utils/enums");
const { isPermitted } = require("../middlewares/role_based_permission");

const router = express.Router();

// ? API to create/sighin a user
router.post(
  apiEnum.REQUEST_SIGNUP,
  [
    body("name", "Name is required"),
    body("email", "Please enter a valid email").notEmpty().isEmail(),
    body("password", "Please enter at least 8 digits").isLength({ min: 8 }),
  ],
  userController.requestCreate
);

// ? API to create/sighin a user
router.post(apiEnum.SIGNUP, userController.create);

// ? API to get all user using querystring
router.get(
  apiEnum.GET_ALL,
  authenticateToken,
  process_query,
  isPermitted(serviceName.USER_SERVICE, apiEnum.GET_ALL),
  userController.getAllUser
);

// ? API to get user by ID
router.get(
  apiEnum.GET_BY_ID,
  authenticateToken,
  isPermitted(serviceName.USER_SERVICE, apiEnum.GET_BY_ID),
  userController.getUserByID
);

// ? API to update user by ID
router.put(
  apiEnum.UPDATE_BY_ID,
  authenticateToken,
  isPermitted(serviceName.USER_SERVICE, apiEnum.UPDATE_BY_ID),
  userController.updateUserByID
);

// ? API to delete user by ID
router.delete(
  apiEnum.DELETE_BY_ID,
  authenticateToken,
  isPermitted(serviceName.USER_SERVICE, apiEnum.DELETE_BY_ID),
  userController.deleteUserByID
);

// ? API to change user role by ID
router.put(
  apiEnum.UPDATE_ROLE,
  authenticateToken,
  isPermitted(serviceName.USER_SERVICE, apiEnum.UPDATE_BY_ID),
  userController.changeUserRoleByID
);

router.put(
  apiEnum.UPDATE,
  authenticateToken,
  userController.updateUserSelfInfo
);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
router.post(apiEnum.UPLOAD, upload.single("file"), uploadImage);

module.exports = router;
