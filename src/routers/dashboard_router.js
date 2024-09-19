const express = require('express');
const apiEnum = require('../utils/api_constant');
const passwordController = require('../controllers/password_controller');
const { process_query } = require("../middlewares/process_query");
const dashboardController  = require('../controllers/dashboard_controller');

const router = express.Router();

// ? API to request for send invitation
router.get(apiEnum.ANALYTICS_TOTAL_DATA, dashboardController.totalInformationAnalyticsController);

router.get(apiEnum.TOTAL_INCOME, dashboardController.totalIncomeController);

router.get(apiEnum.DASHBOARD_SEARCH, dashboardController.dashboardSearchController);

// ? API to request for check temp password
// router.post(apiEnum.CHECK_PASSWORD, invitationController.checkTempPasswordController);


module.exports = router;