const express = require("express");
const apiEnum = require("../utils/api_constant");
const faqController = require("../controllers/faq_controller");
const { process_query } = require("../middlewares/process_query");
const { authenticateToken } = require("../middlewares/token_authenticator");
const { serviceName } = require("../utils/enums");
const { isPermitted } = require("../middlewares/role_based_permission");

const router = express.Router();

// ? API to create a faq
router.post(
  apiEnum.CREATE,
  authenticateToken,
  isPermitted(serviceName.BOT_SERVICE, apiEnum.UPDATE_BY_ID),
  faqController.create
);

// ? API to get all faq using querystring
router.get(apiEnum.GET_ALL, process_query, faqController.getAllFaq);

// ? API to get faq by ID
router.get(apiEnum.GET_BY_ID, authenticateToken, faqController.getFaqByID);

// ? API to update faq by ID
router.put(
  apiEnum.UPDATE_BY_ID,
  authenticateToken,
  isPermitted(serviceName.BOT_SERVICE, apiEnum.UPDATE_BY_ID),
  faqController.updateFaqByID
);

// ? API to delete faq by ID
router.delete(
  apiEnum.DELETE_BY_ID,
  authenticateToken,
  isPermitted(serviceName.BOT_SERVICE, apiEnum.UPDATE_BY_ID),
  faqController.deleteFaqByID
);

module.exports = router;
