const express = require("express");
const apiEnum = require("../utils/api_constant");
const passwordController = require("../controllers/password_controller");
const { process_query } = require("../middlewares/process_query");
const invitationController = require("../controllers/invitation_controller");
const { authenticateToken } = require("../middlewares/token_authenticator");
const { serviceName } = require("../utils/enums");
const { isPermitted } = require("../middlewares/role_based_permission");

const router = express.Router();

// ? API to request for send admin invitation
router.post(
  apiEnum.INVITE_ADMIN,
  authenticateToken,
  isPermitted(serviceName.INVITATION_SERVICE, apiEnum.INVITE_ADMIN),
  invitationController.sendAdminInvitationController
);

// ? API to request for send reseller invitation
router.post(
  apiEnum.INVITE_RESELLER,
  authenticateToken,
  isPermitted(serviceName.INVITATION_SERVICE, apiEnum.INVITE_RESELLER),
  invitationController.sendResellerInvitationController
);

// ? API to request for send user invitation
router.post(
  apiEnum.INVITE_USER,
  authenticateToken,
  isPermitted(serviceName.INVITATION_SERVICE, apiEnum.INVITE_USER),
  invitationController.sendUserInvitationController
);

// ? API to request for check temp password
router.post(
  apiEnum.CHECK_PASSWORD,
  invitationController.checkTempPasswordController
);

module.exports = router;
