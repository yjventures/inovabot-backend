const {
  totalInformationAnalyticsService,totalIncomeService,
  searchEntitiesServices
} = require("../services/dashboard_services");
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

const totalIncomeController = async (req, res, next) => {
  try {
    const totalIncome = await totalIncomeService();
    res.status(200).json({ totalIncome });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

const dashboardSearchController = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ message: 'Query parameter is required' });
    }

    // Call the service to perform the search
    const results = await searchEntitiesServices(name);

    // Return the unified results
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { totalInformationAnalyticsController, totalIncomeController , dashboardSearchController};
