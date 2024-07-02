const {
  getPriceService,
  createStripeSubscriptionService,
  getSubscriptionStatusService,
  billingPortalService,
  saveSubscriptionInfoService,
} = require("../services/subscription_services");
const mongoose = require("mongoose");
const { createError } = require("../common/error");

const getAllPrice = async (req, res, next) => {
  try {
    const prices = await getPriceService();
    if (!prices) {
      return next(createError(500, "Prices fetches failed"));
    }
    res.status(200).json({ message: "Verification successfull", prices });
  } catch (err) {
    next(err);
  }
};

const createStripeSubscription = async (req, res, next) => {
  try {
    const { price_id, stripe_customer_id } = req.body;
    if (!price_id || !stripe_customer_id) {
      return next(
        createError(
          400,
          "Both price id and stripe customer id must be provided"
        )
      );
    }
    const stripeSession = await createStripeSubscriptionService(
      price_id,
      stripe_customer_id
    );
    if (!stripeSession) {
      return next(createError(500, "Failed to create stripe subscription"));
    }
    res
      .status(200)
      .json({ message: "generate checkout URL successfully", stripeSession });
  } catch (err) {
    next(err);
  }
};

const getSubscriptionInfo = async (req, res, next) => {
  try {
    const { stripe_customer_id } = req.query;
    if (!stripe_customer_id) {
      return next(createError(400, "stripe customer id must be provided"));
    }
    const subscriptions = await getSubscriptionStatusService(
      stripe_customer_id
    );
    if (!subscriptions) {
      return next(createError(500, "Failed to fetch subscriptions info"));
    }
    res
      .status(200)
      .json({
        message: "subscription info fetches successfully",
        subscriptions,
      });
  } catch (err) {
    next(err);
  }
};

const saveSubscriptonInfo = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const { user_id, package_id, start_period, end_period } = req.body;
    if (!user_id) {
      return next(createError(400, "user id must be provided"));
    } else if (!package_id) {
      return next(createError(400, "package id must be provided"));
    } else if (!start_period || !end_period) {
      return next(
        createError(400, "start period and end period must be provided")
      );
    }
    const subscriptionInfo = await saveSubscriptionInfoService(
      user_id,
      package_id,
      session,
      start_period,
      end_period
    );

    if (subscriptionInfo) {
      await session.commitTransaction();
      session.endSession();
      res
        .status(200)
        .json({
          message: "subscription info saved successfully",
          subscriptionInfo,
        });
    } else {
      await session.abortTransaction();
      session.endSession();
      return next(createError(503, "Something went wrong"));
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

const billingPortalUrl = async (req, res, next) => {
  try {
    const { stripe_customer_id } = req.body;
    if (!stripe_customer_id) {
      return next(createError(400, "stripe customer id must be provided"));
    }
    const portalSessionUrl = await billingPortalService(stripe_customer_id);
    if (!portalSessionUrl) {
      return next(createError(500, "Failed to create billing portal session"));
    }
    res
      .status(200)
      .json({ message: "Portal link generated successful", portalSessionUrl });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllPrice,
  createStripeSubscription,
  getSubscriptionInfo,
  billingPortalUrl,
  saveSubscriptonInfo,
};
