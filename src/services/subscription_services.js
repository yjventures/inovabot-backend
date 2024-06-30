const { convertUnixTimestampToDate } = require("../common/manage_date");
const subscription = require("../models/subscription");
const { subscriptionSession } = require("../utils/stripe_utils");
const { updateCompanyById } = require("./company_services");
const { findPackageById } = require("./package_services");
const { findUserById } = require("./user_services");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createError } = require("../common/error");


// & get the product price list from stripe
const getPriceService = async () => {
  try {
    const prices = await stripe.prices.list();
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
  stripe_customer_id
) => {
  try {
    // Create a checkout session for a subscription
    const stripeSession = await subscriptionSession(
      price_id,
      stripe_customer_id
    );

    // Send the URL of the checkout session as a JSON response
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
  end_period
) => {
  try {
    const user = await findUserById(user_id, session);
    const companyId = user.company_id;
    // console.log("company id",companyId)
    const package = await findPackageById(package_id, session);
    console.log(package_id)

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

    return updateCompany;
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

module.exports = {
  getPriceService,
  createStripeSubscriptionService,
  getSubscriptionStatusService,
  billingPortalService,
  saveSubscriptionInfoService,
};
