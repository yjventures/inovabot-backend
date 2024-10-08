const {
  totalInformationAnalyticsService,totalIncomeService,
  searchEntitiesServices
} = require("../services/dashboard_services");
const { createError } = require("../common/error");
const { userType } = require("../utils/enums")

const totalInformationAnalyticsController = async (req, res, next) => {
  try {
    if (req.user.type === userType.RESELLER) {
      req.query.reseller_id = req.user.id;
    }
    const data = await totalInformationAnalyticsService(req.query);

    res.status(200).json(data);
  } catch (err) {
    next(createError(404, err.message));
  }
};

const totalIncomeController = async (req, res, next) => {
  try {
    const totalIncome = await totalIncomeService();
    res.status(200).json({ totalIncome });
  } catch (err) {
    next(createError(404, err.message));
  }
}

const dashboardSearchController = async (req, res, next) => {
  try {
    const { name } = req.query;

    if (!name) {
      return next(createError(400, "Query parameter is required"));
    }

    // Call the service to perform the search
    const results = await searchEntitiesServices(name);

    // Return the unified results
    res.status(200).json(results);
  } catch (err) {
    next(createError(404, err.message));
  }
};

module.exports = { totalInformationAnalyticsController, totalIncomeController , dashboardSearchController};
