const stripe = require("stripe")();

const checkSubscriptionStatus = async (req, res, next) => {
  const subscriptionId = req.body.subscriptionId;

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Get the current period end date
    const currentPeriodEnd = subscription.current_period_end;
    const currentPeriodEndDate = new Date(currentPeriodEnd * 1000);

    // Check if the subscription is active and has not expired
    if (subscription.status === "active" && currentPeriodEndDate > new Date()) {
      req.subscription = subscription;
      next();
    } else {
      res
        .status(403)
        .json({ error: "Subscription is either not active or has expired." });
    }
  } catch (error) {
    console.error("Error retrieving subscription:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Export the middleware function
module.exports = { checkSubscriptionStatus };
