const {
  getPriceService,
  createStripeSubscriptionService,
  getSubscriptionStatusService,
  billingPortalService,
  saveSubscriptionInfoService,
  handleWebhookEvent,
} = require("../services/subscription_services");
const mongoose = require("mongoose");
const { createError } = require("../common/error");
const { findPackageById } = require("../services/package_services");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const { id } = req.user;
    const { price_id, package_id, recurring_type } = req.body;
    if (!price_id || !package_id) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "price id and package_id must be provided"));
    }
    const package = await findPackageById(package_id, session);
    if (Number(package.price.monthly.price) === 0) {
      if (!req?.body?.user_id) {
        return next(createError(400, "user_id must be provided for free package"));
      }
      const today = new Date();
      const subscriptionInfo = await saveSubscriptionInfoService(
        req?.body?.user_id,
        package_id,
        session,
        today,
        today.setFullYear(today.getFullYear() + 100),
      );
      await session.commitTransaction();
      session.endSession();
      return res.status(200).json({ message: "Free subscription created successfully" });
    }
    const stripeSession = await createStripeSubscriptionService(
      price_id,
      id,
      package_id,
      recurring_type,
      session
    );
    if (!stripeSession) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(500, "Failed to create stripe subscription"));
    }
    await session.commitTransaction();
    session.endSession();
    res
      .status(200)
      .json({ message: "generate checkout URL successfully", stripeSession });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
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
    res.status(200).json({
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
      res.status(200).json({
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
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { stripe_customer_id } = req.body;
    if (!stripe_customer_id) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(400, "stripe customer id must be provided"));
    }
    const portalSessionUrl = await billingPortalService(stripe_customer_id);
    if (!portalSessionUrl) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(500, "Failed to create billing portal session"));
    }
    await session.commitTransaction();
    session.endSession();
    res
      .status(200)
      .json({ message: "Portal link generated successful", portalSessionUrl });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

const handleWebhook = async (req, res, next) => {
  const session = await mongoose.startSession();
  const sig = req.headers["stripe-signature"];
  const payloadString = JSON.stringify(req.body, null, 2); // Ensure JSON.stringify includes formatting

  // console.log("Received webhook payload:\n", payloadString);
  const header = stripe.webhooks.generateTestHeaderString({
    payload: payloadString,
    secret: process.env.STRIPE_WEBHOOK_SECRET,
  });

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      payloadString,
      header,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // console.log("Successfully constructed event:", event);

    session.startTransaction(); // Start the transaction

    await handleWebhookEvent(event, session);

    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ received: true });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.log(`⚠️  Webhook signature verification failed: ${err.message}`);
    return next(createError(503, `Something wrong in subscription`));
  }
};

module.exports = {
  getAllPrice,
  createStripeSubscription,
  getSubscriptionInfo,
  billingPortalUrl,
  saveSubscriptonInfo,
  handleWebhook,
};
