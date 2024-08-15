const { convertUnixTimestampToDate } = require("../common/manage_date");
const subscription = require("../models/subscription");
const { subscriptionSession } = require("../utils/stripe_utils");
const {
  updateCompanyById,
  findCompanyByObject,
} = require("./company_services");
const { findPackageById } = require("./package_services");
const { findUserById } = require("./user_services");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createError } = require("../common/error");
const Package = require("../models/package");
const Company = require("../models/company");

// & get the product price list from stripe
const getPriceService = async () => {
  try {
    const prices = await Package.find({});
    if (!prices) {
      throw createError(500, "Prices fetch failed");
    }
    return prices;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// & create stripe subscription
const createStripeSubscriptionService = async (
  price_id,
  user_id,
  package_id,
  session
) => {
  try {
    const company = await findCompanyByObject({ user_id }, session);
    if (!company) {
      return next(createError(404, "Company not found"));
    }
    const stripe_customer_id = company?.stripe_customer_id;

    if (!stripe_customer_id) {
      throw createError(400, "stripe customer id not found");
    }
    // Create a checkout session for a subscription
    const stripeSession = await subscriptionSession(
      price_id,
      stripe_customer_id,
      user_id,
      package_id
    );

    // Send the URL of the checkout session as a JSON response
    if (!stripeSession.url) {
      throw createError(500, "Failed to create checkout session");
    }
    return stripeSession.url;
  } catch (error) {
    // Log any errors that occur
    console.error(error);
    throw error;
  }
};

const getSubscriptionStatusService = async (stripe_customer_id) => {
  try {
    // List all subscriptions for the user with their stripe_customer_id
    const subscriptions = await stripe.subscriptions.list({
      customer: stripe_customer_id,
      status: "all",
      limit: 1,
      expand: ["data.default_payment_method"],
    });
    return subscriptions;
  } catch (err) {
    // Log any errors that occur and rethrow them to be handled by the calling function
    console.error(err);
    throw err;
  }
};

const saveSubscriptionInfoService = async (
  user_id,
  package_id,
  session,
  start_period,
  end_period,
  subscriptionId
) => {
  try {
    // console.log("entering the save info services------------>>>")
    const user = await findUserById(user_id, session);
    const companyId = user.company_id;
    // console.log("company id",companyId)
    const package = await findPackageById(package_id, session);
    // console.log(package_id);

    if (!companyId) {
      throw createError(400, "User is not associated with a company");
    }

    if (!package) {
      throw createError(400, "Package not found");
    }

    const subscriptionCollection = await new subscription({
      user_id: user_id,
      company_id: companyId,
      package_id: package_id,
      subscription_id: subscriptionId,
    });
    const newSubscription = await subscriptionCollection.save({ session });

    if (!newSubscription) {
      throw createError(500, "Failed to save subscription info");
    }
    const last_subscribed = convertUnixTimestampToDate(start_period);
    const expires_at = convertUnixTimestampToDate(end_period);
    const body = {
      last_subscribed,
      expires_at,
    };

    const updateCompany = await updateCompanyById(companyId, body, session);

    if (!updateCompany) {
      throw createError(500, "Failed to update company info");
    }

    // console.log("updateCompany",updateCompany)
    return updateCompany;
  } catch (error) {
    throw error;
  }
};

const updateSubscriptionInfoService = async (
  user_id,
  session,
  start_period,
  end_period,
  planId,
  subscriptionId
) => {
  try {
    // console.log("entering the save info services------------>>>")
    const user = await findUserById(user_id, session);
    const companyId = user.company_id;

    if (!companyId) {
      throw createError(400, "User is not associated with a company");
    }

    const query = { user_id: user_id, company_id: companyId };
    const package = await Package.findOne({ stripe_price_id: planId });
    const updateData = {
      package_id: package._id,
      subscription_id: subscriptionId,
    };

    const subscriptionDoc = await subscription.findOne(query).session(session);
    if (subscriptionDoc) {
      // Update the subscription document
      const updatedSubscription = await subscription.findByIdAndUpdate(
        subscriptionDoc._id,
        updateData,
        { new: true, session }
      );

      const last_subscribed = convertUnixTimestampToDate(start_period);
      const expires_at = convertUnixTimestampToDate(end_period);
      const body = {
        last_subscribed,
        expires_at,
      };

      const updateCompany = await updateCompanyById(companyId, body, session);

      if (!updateCompany) {
        throw createError(500, "Failed to update company info");
      }

      // console.log("updateCompany", updateCompany)
      return updateCompany;
    } else {
      throw createError(404, "Subscription not found");
    }
    // console.log("subscription docs",subscriptionDoc)
  } catch (error) {
    throw error;
  }
};

const billingPortalService = async (stripe_customer_id) => {
  try {
    // Create a billing portal session for the user
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripe_customer_id,
      return_url: process.env.STRIPE_SUCCESS_URL, // URL to redirect to after the session
    });

    // console.log(portalSession)
    // Send the URL of the billing portal session as a JSON response
    return portalSession.url;
  } catch (err) {
    // Log any errors that occur
    console.error(err);
    throw err;
  }
};

// & web hook
const handleCheckoutSessionCompleted = async (eventSession, session) => {
  try {
    // console.log("Received session:", eventSession);

    // Extract subscription ID from session
    const subscriptionId = eventSession.id; // Assuming 'id' in session refers to the subscription ID
    console.log("Subscription ID: from when save", subscriptionId);

    // Retrieve subscription details
    // const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    // console.log("Subscription details:", subscription);

    // Extract metadata from session for custom processing
    const userId = eventSession.metadata.user_id;
    const packageId = eventSession.metadata.package_id;
    const startPeriod = eventSession.current_period_start;
    const endPeriod = eventSession.current_period_end;

    console.log("User ID:", userId);
    console.log("Package ID:", packageId);
    console.log("Start period:", startPeriod);
    console.log("End period:", endPeriod);

    // Example of saving subscription information using a service function
    await saveSubscriptionInfoService(
      userId,
      packageId,
      session,
      startPeriod,
      endPeriod,
      subscriptionId
    );

    // console.log(`Subscription processed: ${subscription.id}`);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(`Error processing subscription: ${err.message}`);
    throw createError(500, `Error processing subscription: ${err.message}`);
  }
};

const handleUpdateSessionCompleted = async (eventSession, session) => {
  try {
    // console.log("Received update session: id====>", eventSession.plan.id);
    const planId = eventSession.plan.id;
    // Extract subscription ID from session
    const subscriptionId = eventSession.id; // Assuming 'id' in session refers to the subscription ID
    // console.log("Subscription ID:", subscriptionId);

    // Retrieve subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    console.log("Subscription details:", subscription);

    // Extract metadata from session for custom processing
    const userId = eventSession.metadata.user_id;
    const packageId = eventSession.metadata.package_id;
    const startPeriod = subscription.current_period_start;
    const endPeriod = subscription.current_period_end;

    console.log("User ID:", userId);
    console.log("Package ID:", packageId);
    console.log("Start period:", startPeriod);
    console.log("End period:", endPeriod);

    // Example of saving subscription information using a service function
    await updateSubscriptionInfoService(
      userId,
      session,
      startPeriod,
      endPeriod,
      planId,
      subscriptionId
    );

    // console.log(`Subscription processed: ${subscription.id}`);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(`Error processing subscription: ${err.message}`);
    throw createError(500, `Error processing subscription: ${err.message}`);
  }
};
const handleWebhookEvent = async (event, session) => {
  try {
    switch (event.type) {
      case "customer.subscription.created":
        // Handle subscription creation event
        const subscriptionId = event.data.object.id;

        await handleCheckoutSessionCompleted(event.data.object, session);
        break;
      case "checkout.session.completed":
        console.log("checkout.session.completed");
        break;
      case "customer.subscription.updated":
        await handleUpdateSessionCompleted(event.data.object, session);
        break;
      case "customer.subscription.deleted":
        console.log("customer.subscription.deleted");
        break;
      //... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (err) {
    console.error(`Error handling event type ${event.type}: ${err.message}`);
    throw err;
  }
};

module.exports = {
  getPriceService,
  createStripeSubscriptionService,
  getSubscriptionStatusService,
  billingPortalService,
  saveSubscriptionInfoService,
  handleWebhookEvent,
};
