const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
require("dotenv").config();

// ^ create stripe customer
const createStripeCustomer = async (email) => {
  try {
    const customer = await stripe.customers.create({
      email: email,
    });
    return customer;
  } catch (err) {
    throw createError(500, 'Create Stripe Customer error');
  }
};

// ^ Create a checkout session for a subscription
const subscriptionSession = async (priceId, userCustomerId) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer: userCustomerId, // customer: "cus_PgjmeMfjbx7SmI",
      success_url: process.env.STRIPE_SUCCESS_URL,
      cancel_url: process.env.STRIPE_CANCEL_URL,
    });
    
    return session.url;
  } catch (error) {
    throw createError(500, 'Checkout Session Error');
  }
};

// ^ List all subscriptions for the user with their stripe_customer_id
const getAllSubscription = async (userCustomerId) => {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: userCustomerId,
      // customer: "cus_PgjmeMfjbx7SmI",
      status: "all",
      expand: ["data.default_payment_method"],
    });

    return subscriptions;
  } catch (error) {
    throw createError(500, 'Error for show stripe subscriptions');
  }
};

module.exports = {
  createStripeCustomer,
  subscriptionSession,
  getAllSubscription,
};
