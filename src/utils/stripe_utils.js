const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
require("dotenv").config();
const { currency } = require("../utils/enums");
const { createError } = require("../common/error");

// ^ create product and price utils
// const createProduct = async (
//   name,
//   unit_amount,
//   currency,
//   interval,
//   interval_count = 1
// ) => {
//   try {
//     const product = await stripe.products.create({
//       name,
//     });

//     const price = await stripe.prices.create({
//       unit_amount, // Price amount in the smallest currency unit (e.g., cents for USD)
//       currency: currency ?? currency.USD,
//       product: product.id, // Associate the price with the product created above
//       nickname: name, // Set the nickname for the price
//       recurring: {
//         interval, // Example: setting a monthly recurring price
//         interval_count,
//       },
//     });

//     return price;
//   } catch (error) {
//     throw createError(500, "product price creation failed");
//   }
// };

// ^ create product and price utils
const createProductWithMultiplePrices = async (
  name,
  unit_amount_monthly,
  unit_amount_yearly,
  currency
) => {
  try {
    const product = await stripe.products.create({
      name,
    });

    const monthlyPrice = await stripe.prices.create({
      unit_amount: unit_amount_monthly * 100,
      currency: currency || 'usd',
      product: product.id,
      nickname: `${name} Monthly`,
      recurring: {
        interval: 'month',
        interval_count: 1,
      },
    });

    const yearlyPrice = await stripe.prices.create({
      unit_amount: unit_amount_yearly * 100,
      currency: currency || 'usd',
      product: product.id,
      nickname: `${name} Yearly`,
      recurring: {
        interval: 'year',
        interval_count: 1,
      },
    });

    return {
      product,
      monthlyPrice,
      yearlyPrice,
    };
  } catch (error) {
    throw new Error("Product price creation failed: " + error.message);
  }
};


// ^ create stripe customer
const createStripeCustomer = async (email) => {
  try {
    const customer = await stripe.customers.create({
      email: email,
    });
    return customer;
  } catch (err) {
    throw createError(500, "Create Stripe Customer error");
  }
};

// ^ Create a checkout session for a subscription
const subscriptionSession = async (
  priceId,
  stripeCustomerId,
  userId,
  recurring_type,
  packageId
) => {
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
      customer: stripeCustomerId, // customer: "cus_PgjmeMfjbx7SmI",
      success_url: process.env.STRIPE_SUCCESS_URL,
      cancel_url: process.env.STRIPE_CANCEL_URL,
      // metadata: {
      //   user_id: userId,
      //   package_id: packageId,
      // },
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          user_id: userId,
          package_id: packageId,
          recurring_type: recurring_type,
          price_id: priceId
        },
      },
    });
    console.log("session subscription session", session);
    return session;
  } catch (error) {
    console.error(error);
    throw createError(500, "Checkout Session Error");
  }
};

// ^ upgrade a checkout session for a subscription
const updateSubscription = async (price_id,
  subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: price_id,
      }],
      proration_behavior: 'create_prorations',

    });

    return updatedSubscription;
  } catch (error) {
    console.error("Error updating subscription:", error);
    throw createError(500, "Failed to update subscription");
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
    throw createError(500, "Error for show stripe subscriptions");
  }
};

module.exports = {
  createStripeCustomer,
  subscriptionSession,
  getAllSubscription,
  createProductWithMultiplePrices,
  updateSubscription
};
