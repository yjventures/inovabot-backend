const { convertUnixTimestampToDate } = require("../common/manage_date");
const subscription = require("../models/subscription");
const { subscriptionSession } = require("../utils/stripe_utils");
const {
  updateCompanyById,
  findCompanyByObject,
} = require("./company_services");
const { findPackageById } = require("./package_services");
const { findUserById, updateUserById } = require("./user_services");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createError } = require("../common/error");
const Package = require("../models/package");
const Company = require("../models/company");
const mongoose = require("mongoose");

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
      package_id,
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
    console.log("entering the save subscription info services------------>>>");
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
      payment_status: true
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
    console.log("Entering updateSubscriptionInfoService...");
    const user = await findUserById(user_id, session);

    if (!user) {
      throw createError(404, "User not found");
    }

    const companyId = user.company_id;
    console.log("User's company ID:", companyId);

    if (!companyId) {
      throw createError(400, "User is not associated with a company");
    }

    const query = { user_id: user_id, company_id: companyId };
    console.log("Query for finding subscription:", query);

    const package = await Package.findOne({
      $or: [
        { "price.monthly.stripe_id": planId },
        { "price.yearly.stripe_id": planId },
      ],
    });

    if (!package) {
      throw createError(404, "Package not found");
    }

    console.log("Found package:", package);

    const updateData = {
      package_id: package._id,
      subscription_id: subscriptionId,
    };
    console.log("Update data:", updateData);

    const subscriptionDoc = await subscription.findOne(query).session(session);
    console.log("Found subscription document:", subscriptionDoc);

    if (!subscriptionDoc) {
      throw createError(404, "Subscription not found");
    }

    const updatedSubscription = await subscription.findByIdAndUpdate(
      subscriptionDoc._id,
      updateData,
      { new: true, session }
    );
    console.log("Updated subscription document:", updatedSubscription);

    const last_subscribed = convertUnixTimestampToDate(start_period);
    console.log("last_subscribed", last_subscribed);
    const expires_at = convertUnixTimestampToDate(end_period);
    console.log("expires_at", expires_at);

    const body = {
      last_subscribed,
      expires_at,
      payment_status: true,
    };

    console.log("Body:", body);

    const updateCompany = await updateCompanyById(companyId, body, session);
    console.log("Company updated successfully:", updateCompany);

    if (!updateCompany) {
      throw createError(500, "Failed to update company info");
    }
    const updateUser = await updateUserById(
      user_id,
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
const handleCheckoutSessionCompleted = async (eventSession) => {
  const session = await mongoose.startSession(); // Start a new session
  session.startTransaction(); // Start the transaction

  try {
    // Extract subscription ID from session
    const subscriptionId = eventSession.id; // Assuming 'id' in session refers to the subscription ID
    console.log("Subscription ID: from when save", subscriptionId);

    // Retrieve subscription details (commented out for simplicity)
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

    // Save subscription information using the service function
    await saveSubscriptionInfoService(
      userId,
      packageId,
      session, // Pass the session to the service function
      startPeriod,
      endPeriod,
      subscriptionId
    );

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

// const handleUpdateSessionCompleted = async (eventSession) => {
//   const session = await mongoose.startSession(); // Start a new session
//   session.startTransaction(); // Start the transaction

//   console.log("Received update session:", eventSession);
//   try {
//     const planId = eventSession?.plan?.id;
//     const subscriptionId = eventSession?.id;

//     const subscription = await stripe?.subscriptions?.retrieve(subscriptionId);
//     //console.log("Subscription details:", subscription);

//     const userId = eventSession?.metadata?.user_id;
//     const packageId = eventSession?.metadata?.package_id;
//     const startPeriod = subscription?.current_period_start;
//     const endPeriod = subscription?.current_period_end;

//     console.log("User ID:", userId);
//     console.log("Package ID:", packageId);
//     console.log("Start period:", startPeriod);
//     console.log("End period:", endPeriod);

//     const result = await updateSubscriptionInfoService(
//       userId,
//       session,
//       startPeriod,
//       endPeriod,
//       planId,
//       subscriptionId
//     );
//     console.log("updateSubscriptionInfoService Result:", result);

//     // Commit the transaction if everything is successful
//     await session.commitTransaction();
//     console.log("Transaction committed successfully");
//   } catch (err) {
//     console.error("Error during subscription processing:", err);

//     try {
//       await session.abortTransaction(); // Abort the transaction if an error occurs
//       console.error("Transaction aborted due to error");
//     } catch (abortError) {
//       console.error("Error aborting transaction:", abortError);
//     } finally {
//       session.endSession(); // End the session in any case
//     }

//     throw createError(500, `Error processing subscriptions: ${err.message}`);
//   } finally {
//     session.endSession(); // Ensure the session is always ended
//   }
// };

const handleUpdateSessionCompleted = async (eventSession) => {
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    const session = await mongoose.startSession(); // Start a new session
    session.startTransaction(); // Start the transaction

    console.log("Received update session:", eventSession);
    try {
      const planId = eventSession?.plan?.id;
      const subscriptionId = eventSession?.id;

      const subscription = await stripe?.subscriptions?.retrieve(subscriptionId);
      const userId = eventSession?.metadata?.user_id;
      const packageId = eventSession?.metadata?.package_id;
      const startPeriod = subscription?.current_period_start;
      const endPeriod = subscription?.current_period_end;

      const result = await updateSubscriptionInfoService(
        userId,
        session,
        startPeriod,
        endPeriod,
        planId,
        subscriptionId
      );
      console.log("updateSubscriptionInfoService Result:", result);

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
        throw createError(500, `Error processing subscriptions: ${err.message}`);
      }

      console.log(`Retrying transaction (${retryCount}/${maxRetries})...`);
    } finally {
      session.endSession(); // Ensure the session is always ended
    }
  }
};


// const handleWebhookEvent = async (event, session) => {
//   try {
//     switch (event.type) {
//       case "customer.subscription.created":
//         // Handle subscription creation event
//         const subscriptionId = event.data.object.id;

//         await handleCheckoutSessionCompleted(event.data.object, session);
//         break;
//       case "checkout.session.completed":
//         console.log("checkout.session.completed");
//         break;
//       case "customer.subscription.updated":
//         await handleUpdateSessionCompleted(event?.data?.object, session);
//         break;
//       case "customer.subscription.deleted":
//         console.log("customer.subscription.deleted");
//         break;
//       //... handle other event types
//       default:
//         console.log(`Unhandled event type ${event.type}`);
//     }
//   } catch (err) {
//     console.error(`Error handling event type ${event.type}: ${err.message}`);
//     throw err;
//   }
// };

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

    await User.findByIdAndUpdate(user_id, { payment_status: false, last_subscribed: null, expires_at: null }, { session }); // Use session here

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
};
