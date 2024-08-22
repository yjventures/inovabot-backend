const express = require("express");
const { body } = require("express-validator");
const apiEnum = require("../utils/api_constant");
const categoryController = require("../controllers/category_controller");
const { process_query } = require("../middlewares/process_query");
const { authenticateToken } = require("../middlewares/token_authenticator");
const { packageFeature } = require("../middlewares/package_feature");
const { serviceName } = require("../utils/enums");
const { isPermitted } = require("../middlewares/role_based_permission");

const router = express.Router();

// ? API to create a company
router.post(
  apiEnum.CREATE,
  authenticateToken,
  // isPermitted(serviceName.CATEGORY_SERVICE, apiEnum.CREATE),
  categoryController.create
);

// ? API to get all company using querystring
router.get(
  apiEnum.GET_ALL,
  authenticateToken,
  // isPermitted(serviceName.CATEGORY_SERVICE, apiEnum.GET_ALL),
  categoryController.getAllCategoriesController
);

// ? API to get company by ID
router.get(
  apiEnum.GET_BY_ID,
  authenticateToken,
  // isPermitted(serviceName.COMPANY_SERVICE, apiEnum.GET_BY_ID),
  categoryController.getSingleCategoryController
);

// ? API to update company by ID
router.put(
  apiEnum.UPDATE_BY_ID,
  authenticateToken,
  // isPermitted(serviceName.CATEGORY_SERVICE, apiEnum.UPDATE_BY_ID),
  categoryController.update
);

// ? API to delete company by ID
router.delete(
  apiEnum.DELETE_BY_ID,
  authenticateToken,
  // isPermitted(serviceName.  CATEGORY_SERVICE, apiEnum.DELETE_BY_ID),
  categoryController.deleteCategoryController
);

module.exports = router;
