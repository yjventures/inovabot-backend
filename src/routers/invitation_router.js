const express = require('express');
const apiEnum = require('../utils/api_constant');
const passwordController = require('../controllers/password_controller');
const { process_query } = require("../middlewares/process_query");
const invitationController  = require('../controllers/invitation_controller');

const router = express.Router();

// ? API to request for send invitation
router.post(apiEnum.CREATE, invitationController.sendInvitationController);

// ? API to request for check temp password
router.post(apiEnum.CHECK_PASSWORD, invitationController.checkTempPasswordController);


module.exports = router;