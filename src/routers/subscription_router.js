const express = require("express");
const apiEnum = require("../utils/api_constant");
const subscriptionController = require("../controllers/subscription_controller");

const router = express.Router();

// ? API to show all stripe product prices
router.get(apiEnum.GET_ALL, subscriptionController.getAllPrice);

// ? API to get the subscription checkout url
router.post(apiEnum.CREATE, subscriptionController.createStripeSubscription);

// ? API to get all stripe subscription info
router.get(
  apiEnum.STRIPE_SUBSCRIPTION_INFO,
  subscriptionController.getSubscriptionInfo
);

// ? API to get stripe billing portal url
router.post(
  apiEnum.STRIPE_BILLING_PORTAL,
  subscriptionController.billingPortalUrl
);

// ? API to update subscription info
router.put(
  apiEnum.STRIPE_UPDATE_INFO,
  subscriptionController.saveSubscriptonInfo
);

module.exports = router;
