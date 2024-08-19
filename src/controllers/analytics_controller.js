const {
  totalInformationAnalyticsService,
} = require("../services/analytics_services");
const mongoose = require("mongoose");

const totalInformationAnalyticsController = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Get the filter from the request params
    const { filter } = req.query;
    
    const data = await totalInformationAnalyticsService(filter, session);

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(data);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};


module.exports = { totalInformationAnalyticsController };
