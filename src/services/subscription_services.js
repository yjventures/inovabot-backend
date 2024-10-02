const { convertUnixTimestampToDate } = require("../common/manage_date");
const subscription = require("../models/subscription");
const {
  subscriptionSession,
  updateSubscription,
} = require("../utils/stripe_utils");
const {
  updateCompanyById,
  findCompanyByObject,
  findCompanyById,
} = require("./company_services");
const { findPackageById } = require("./package_services");
const { findUserById, updateUserById } = require("./user_services");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createError } = require("../common/error");
const Package = require("../models/package");
const Company = require("../models/company");
const mongoose = require("mongoose");
const cron = require("node-cron");

cron.schedule("0 0 * * *", async () => {
  console.log("Running scheduled cancellation job...");
  try {
    // Get today's date in UTC and set time to 00:00:00 for comparison
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setUTCDate(today.getUTCDate() + 1);
    const companies = await Company.find({
      expires_at: {
        $gte: today,
        $lt: endOfToday,
      },
    });

    for (const company of companies) {
      await findByIdAndUpdate(
        company?._id,
        {
          recurring_type: "",
          last_subscribed: null,
          expires_at: null,
          subscription_id: "",
        },
        {
          new: true,
        }
      );
    }

    console.log(
      `${companies.length} companies updated with subscription cancellation.`
    );
  } catch (error) {
    console.error("Error running cancellation cron job:", error);
  }
});

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
  company_id,
  package_id,
  recurring_type,
  // isReseller, // Add isReseller here
  session
) => {
  try {

    const company = await findCompanyById(company_id, session);
    if (!company) {
      throw createError(404, "Company not found");
    }

    const stripe_customer_id = company?.stripe_customer_id;
    if (!stripe_customer_id) {
      throw createError(400, "Stripe customer ID not found");
    }

    // Create a checkout session for a subscription with the reseller flag
    const stripeSession = await subscriptionSession(
      price_id,
      stripe_customer_id,
      company_id,
      recurring_type,
      package_id,
      // isReseller // Pass isReseller flag
    );

    // Send the URL of the checkout session as a JSON response
    if (!stripeSession.url) {
      throw createError(500, "Failed to create checkout session");
    }

    return stripeSession.url;
  } catch (error) {
    // Log any errors that occur
    console.error("Error in subscription service:", error);
    throw error;
  }
};


// & upgrade or downgrade stripe subscription
const upgradeStripeSubscriptionService = async (
  price_id,
  company_id,
  package_id,
  recurring_type,
  session
) => {
  try {
    const company = await findCompanyById(company_id, session);
    if (!company) {
      throw createError(404, "Company not found");
    }
    const stripe_customer_id = company?.stripe_customer_id;
    const subscriptionId = company?.subscription_id;

    if (!stripe_customer_id) {
      throw createError(400, "stripe customer id not found");
    }
    if (!subscriptionId) {
      throw createError(400, "subscription id not found");
    }

    // Update the subscription with the new price
    const updatedSubscription = await updateSubscription(
      price_id,
      subscriptionId
    );
    if (!updatedSubscription) {
      throw createError(500, "Failed to update subscription");
    }

    // Extract the start and end periods from the updated subscription
    const start_period = updatedSubscription.current_period_start; // Unix timestamp
    const end_period = updatedSubscription.current_period_end; // Unix timestamp

    const last_subscribed = convertUnixTimestampToDate(start_period);

    const expires_at = convertUnixTimestampToDate(end_period);
    const body = {
      last_subscribed,
      expires_at,
      payment_status: true,
      package: package_id,
      recurring_type,
      price_id,
      subscription_id: subscriptionId,
    };

    const updateCompany = await updateCompanyById(company?._id, body, session);

    if (!updateCompany) {
      throw createError(500, "Failed to update company info");
    }
    return updateCompany;
  } catch (error) {
    throw error;
  }
};

// & cancel stripe subscription
const cancelStripeSubscriptionService = async (user_id, session) => {
  try {
    // Find the user's company or subscription info from the database
    const company = await findCompanyByObject({ user_id }, session);
    if (!company) {
      throw createError(404, "Company not found");
    }
    
    const subscriptionId = company.subscription_id;
    if (!subscriptionId) {
      throw createError(400, "No active subscription found");
    }

    // Retrieve subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (!subscription) {
      throw createError(500, "Failed to retrieve subscription from Stripe");
    }

    const isTrialActive = subscription.trial_end && subscription.trial_end > Math.floor(Date.now() / 1000);
    let updateCompany;

    if (isTrialActive) {
      // Cancel immediately if in trial
      const trialSubscription = await stripe.subscriptions.cancel(subscriptionId);
      if (!trialSubscription) {
        throw createError(500, "Failed to cancel trial subscription");
      }

      const updateData = {
        recurring_type: "",
        last_subscribed: null,
        expires_at: null,
        subscription_id: "",
      };

      updateCompany = await updateCompanyById(company?._id, updateData, session);
      if (!updateCompany) {
        throw createError(500, "Failed to update company info");
      }
      return updateCompany;
    } else {
      // Schedule cancellation at the end of the billing period
      const updateSubscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      if (!updateSubscription) {
        throw createError(500, "Failed to cancel subscription");
      }

      return updateSubscription;
    }
  } catch (error) {
    console.error("Error canceling subscription:", error);
    throw error; // Re-throw the error to be handled in the controller
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
  companyId,
  package_id,
  session,
  start_period,
  end_period,
  recurringType,
  priceId,
  subscriptionId
) => {
  try {
    console.log("entering the save subscription info services------------>>>");
    const company = await findCompanyById(companyId, session);
    const package = await findPackageById(package_id, session);

    if (!company) {
      throw createError(400, "User is not associated with a company");
    }

    if (!package) {
      throw createError(400, "Package not found");
    }

    const subscriptionCollection = await new subscription({
      user_id: company?.user_id,
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
      payment_status: true,
      package: package_id,
      recurring_type: recurringType,
      price_id: priceId,
      subscription_id: subscriptionId,
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

const updateSubscriptionInfoService = async (
  companyId,
  session,
  start_period,
  end_period,
  planId,
  recurringType,
  subscriptionId
) => {
  try {
    const company = await findCompanyById(companyId, session)
    if (!company) {
      throw createError(404, "Company not found");
    }

    const query = { user_id: company?.user_id, company_id: companyId };

    const package = await Package.findOne({
      $or: [
        { "price.monthly.stripe_id": planId },
        { "price.yearly.stripe_id": planId },
      ],
    });

    if (!package) {
      throw createError(404, "Package not found");
    }

    const updateData = {
      package_id: package?._id,
      subscription_id: subscriptionId,
    };

    const subscriptionDoc = await subscription.findOne(query).session(session);

    if (!subscriptionDoc) {
      throw createError(404, "Subscription not found");
    }

    const updatedSubscription = await subscription.findByIdAndUpdate(
      subscriptionDoc?._id,
      updateData,
      { new: true, session }
    );
    const last_subscribed = convertUnixTimestampToDate(start_period);
    const expires_at = convertUnixTimestampToDate(end_period);

    const body = {
      last_subscribed,
      expires_at,
      payment_status: true,
      package: package?._id,
      recurring_type: recurringType,
    };

    const updateCompany = await updateCompanyById(companyId, body, session);

    if (!updateCompany) {
      throw createError(500, "Failed to update company info");
    }
    const updateUser = await updateUserById(
      company.user_id.toString(),
      { active_subscription: null },
      session
    );
    if (!updateUser) {
      throw createError(500, "Failed to update user info");
    }

    return updateCompany;
  } catch (error) {
    console.error("Error in updateSubscriptionInfoService:", error);
    throw error; // This will propagate up to handleUpdateSessionCompleted
  }
};

const billingPortalService = async (stripe_customer_id) => {
  try {
    // Create a billing portal session for the user
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripe_customer_id,
      return_url: process.env.STRIPE_SUCCESS_URL, // URL to redirect to after the session
    });

    // Send the URL of the billing portal session as a JSON response
    return portalSession.url;
  } catch (err) {
    // Log any errors that occur
    console.error(err);
    throw err;
  }
};

// & web hook
const handleCheckoutSessionCompleted = async (eventSession) => {
  const session = await mongoose.startSession(); // Start a new session
  session.startTransaction(); // Start the transaction

  try {
    // Extract subscription ID from session
    const subscriptionId = eventSession.id;
    if(!subscriptionId){
      throw createError(400, "Subscription ID not found in session");
    }
    // Extract metadata from session for custom processing
    const companyId = eventSession.metadata.company_id;
    const packageId = eventSession.metadata.package_id;
    const startPeriod = eventSession.current_period_start;
    const endPeriod = eventSession.current_period_end;
    const recurringType = eventSession.metadata.recurring_type;
    const priceId = eventSession.metadata.price_id;

    const company = await findCompanyById(companyId, session)
    if(!company){
      throw createError(400, "Company not found")
    }


    // Save subscription information using the service function
    await saveSubscriptionInfoService(
      companyId,
      packageId,
      session, // Pass the session to the service function
      startPeriod,
      endPeriod,
      recurringType,
      priceId,
      subscriptionId
    );

    //TODO: this is for active subscription is equal null
    const updateUser = await updateUserById(
      company.user_id,
      { active_subscription: null },
      session
    );
    if (!updateUser) {
      throw createError(500, "Failed to update user info");
    }

    // Commit the transaction if everything is successful
    await session.commitTransaction();
    console.log("Transaction committed successfully");
  } catch (err) {
    console.error(`Error processing subscription: ${err.message}`);

    try {
      await session.abortTransaction(); // Abort the transaction if an error occurs
      console.error("Transaction aborted due to error");
    } catch (abortError) {
      console.error("Error aborting transaction:", abortError);
    } finally {
      session.endSession(); // End the session in any case
    }

    throw createError(500, `Error processing subscription: ${err.message}`);
  } finally {
    // Ensure the session is always ended
    session.endSession();
  }
};

const handleUpdateSessionCompleted = async (eventSession) => {
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    const session = await mongoose.startSession(); // Start a new session
    session.startTransaction(); // Start the transaction

    try {
      const planId = eventSession?.plan?.id;
      const subscriptionId = eventSession?.id;

      const subscription = await stripe?.subscriptions?.retrieve(
        subscriptionId
      );
      const companyId = eventSession?.metadata?.company_id;
      const packageId = eventSession?.metadata?.package_id;
      const startPeriod = subscription?.current_period_start;
      const endPeriod = subscription?.current_period_end;
      const recurringType = eventSession?.metadata?.recurring_type;

      const result = await updateSubscriptionInfoService(
        companyId,
        session,
        startPeriod,
        endPeriod,
        planId,
        recurringType,
        subscriptionId
      );

      // Commit the transaction if everything is successful
      await session.commitTransaction();
      console.log("Transaction committed successfully");
      break; // Exit loop on success
    } catch (err) {
      console.error("Error during subscription processing:", err);

      try {
        await session.abortTransaction(); // Abort the transaction if an error occurs
        console.error("Transaction aborted due to error");
      } catch (abortError) {
        console.error("Error aborting transaction:", abortError);
      } finally {
        session.endSession(); // End the session in any case
      }

      retryCount++;
      if (retryCount >= maxRetries) {
        // Throw an error if the max number of retries is reached
        throw createError(
          500,
          `Error processing subscriptions: ${err.message}`
        );
      }

      console.log(`Retrying transaction (${retryCount}/${maxRetries})...`);
    } finally {
      session.endSession(); // Ensure the session is always ended
    }
  }
};


const handleSubscriptionDeletion = async (subscriptionData) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user_id = subscriptionData.metadata.user_id; // Assuming you store user ID in metadata
    const user = await findUserById(user_id).session(session); // Use session in query

    if (!user) {
      throw createError(404, "User not found");
    }

    const companyId = user.company_id;
    console.log("User's company ID:", companyId);

    if (!companyId) {
      throw createError(400, "User is not associated with a company");
    }

    await User.findByIdAndUpdate(
      user_id,
      { payment_status: false, last_subscribed: null, expires_at: null },
      { session }
    ); // Use session here

    // If everything is successful, commit the transaction
    await session.commitTransaction();
    console.log(`Subscription for user ${user_id} marked as inactive`);
  } catch (err) {
    // If any error occurs, abort the transaction
    await session.abortTransaction();
    console.error(`Error updating user subscription status: ${err.message}`);
    throw err;
  } finally {
    // End the session
    session.endSession();
  }
};

const handleWebhookEvent = async (event) => {
  // const session = await mongoose.startSession();
  // session.startTransaction();

  try {
    switch (event.type) {
      case "customer.subscription.created":
        // const subscriptionId = event.data.object.id;
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case "checkout.session.completed":
        console.log("checkout.session.completed");
        // Handle checkout session completion logic here
        break;

      case "customer.subscription.updated":
        await handleUpdateSessionCompleted(event?.data?.object);
        break;

      case "customer.subscription.deleted":
        // Handle subscription deletion logic here
        await handleSubscriptionDeletion(event?.data?.object);
        break;

      // Handle other event types as needed
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Commit the transaction if all operations are successful
    // await session.commitTransaction();
  } catch (err) {
    // Abort the transaction if an error occurs
    // await session.abortTransaction();
    console.error(`Error handling event type ${event.type}: ${err.message}`);
    throw err;
  } finally {
    // End the session to clean up resources
    // session.endSession();
  }
};

module.exports = {
  getPriceService,
  createStripeSubscriptionService,
  getSubscriptionStatusService,
  billingPortalService,
  saveSubscriptionInfoService,
  handleWebhookEvent,
  upgradeStripeSubscriptionService,
  cancelStripeSubscriptionService,
};
