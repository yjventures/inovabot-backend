const express = require('express');
const apiEnum = require('../utils/api_constant');
const { process_query } = require("../middlewares/process_query");
const dashboardController  = require('../controllers/dashboard_controller');
const { authenticateToken } = require("../middlewares/token_authenticator");

const router = express.Router();

// ? API to request for send invitation
router.get(apiEnum.ANALYTICS_TOTAL_DATA, authenticateToken, dashboardController.totalInformationAnalyticsController);

router.get(apiEnum.TOTAL_INCOME, dashboardController.totalIncomeController);

router.get(apiEnum.DASHBOARD_SEARCH, authenticateToken, dashboardController.dashboardSearchController);

// ? API to request for check temp password
// router.post(apiEnum.CHECK_PASSWORD, invitationController.checkTempPasswordController);


module.exports = router;