const moment = require("moment");
const Bot = require("../models/bot");
const Company = require("../models/company");
const File = require("../models/file");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { createError } = require("../common/error");
const OPENAI_API_KEY = process.env.OPENAI_API;
const UNKNOWN_KEY = "Bearer sess-cTYyRjwPDCZTatBJ67YsnZbeNV8wDyfmTXcTLRTh";

const totalInformationAnalyticsService = async (
  query
) => {
  try {
    console.log("filter", filter);
    let startDate, endDate;
    const { filter } = query;
    delete query.filter;

    // Determine the start and end date based on the filter
    switch (filter) {
      case "12months":
        startDate = moment().subtract(12, "months").toDate();
        break;
      case "30days":
        startDate = moment().subtract(30, "days").toDate();
        break;
      case "7days":
        startDate = moment().subtract(7, "days").toDate();
        break;
      case "24hours":
        startDate = moment().subtract(1, "days").toDate();
        break;
      default:
        startDate = moment(0).toDate(); // For 'all', start from the earliest possible date
        break;
    }

    // End date is always now for 'All' and other time periods
    endDate = new Date();
    console.log(startDate);
    console.log(endDate);

    // Query each model and get the count of documents that match the filterCondition
    const [botCount, companyCount, fileCount] = await Promise.all([
      Bot.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
        ...query,
      })
        .lean(),
      Company.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
        ...query,
      })
        .lean(),
      File.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
        ...query,
      })
        .lean(),
    ]);

    const startOfToday = moment().startOf("day").toDate();

    // Get the end of today
    const endOfToday = moment().endOf("day").toDate();

    const [todayBotCount, todayCompanyCount, todayFileCount] =
      await Promise.all([
        Bot.countDocuments({
          createdAt: { $gte: startOfToday, $lte: endOfToday },
          ...query,
        })
          .lean(),
        Company.countDocuments({
          createdAt: { $gte: startOfToday, $lte: endOfToday },
          ...query,
        })
          .lean(),
        File.countDocuments({
          createdAt: { $gte: startOfToday, $lte: endOfToday },
          ...query,
        })
          .lean(),
      ]);

    const startOfYesterday = moment()
      .subtract(1, "days")
      .startOf("day")
      .toDate();

    // Get the end of yesterday
    const endOfYesterday = moment().subtract(1, "days").endOf("day").toDate();

    const [botCountYesterday, companyCountYesterday, fileCountYesterday] =
      await Promise.all([
        Bot.countDocuments({
          createdAt: { $gte: startOfYesterday, $lte: endOfYesterday },
          ...query,
        })
          .lean(),
        Company.countDocuments({
          createdAt: { $gte: startOfYesterday, $lte: endOfYesterday },
          ...query,
        })
          .lean(),
        File.countDocuments({
          createdAt: { $gte: startOfYesterday, $lte: endOfYesterday },
          ...query,
        })
          .lean(),
      ]);

    const botDifference = todayBotCount - botCountYesterday;
    const comapanyDifference = todayFileCount - companyCountYesterday;
    const fileDifference = todayCompanyCount - fileCountYesterday;

    return {
      botCount,
      companyCount,
      fileCount,
      botDifference,
      comapanyDifference,
      fileDifference,
    };
  } catch (err) {
    throw err;
  }
};

const totalIncomeService = async ()=>{
  try {
    // Fetch balance
    const balance = await stripe.balance.retrieve();

    // Available balance (funds ready for payout)
    const availableBalance = balance.available.reduce((total, bal) => {
      if (bal.currency === 'usd') {
        return total + bal.amount;
      }
      return total;
    }, 0);

    const available = availableBalance / 100;

    //this is for open ai costs
    console.log(UNKNOWN_KEY)

    const response = await fetch(`https://api.openai.com/dashboard/billing/usage?end_date=2024-10-01&exclude_project_costs=true&new_endpoint=true&project_id&start_date=2024-09-01`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${UNKNOWN_KEY}`,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw createError(400, 'Network response was not ok');
    }


    console.log('Usage Data:', data);

    return {
     available
    };
  } catch (err) {
    throw err;
  }
}

const searchEntitiesServices = async (query) => {
  try {
    const regex = new RegExp(query, "i"); // 'i' makes it case-insensitive

    // Search for companies and bots using the regex
    const companies = await Company.find({ name: { $regex: regex } }).lean();
    const bots = await Bot.find({ name: { $regex: regex } }).lean();

    // Normalize the data to a common format
    const normalizedCompanies = companies.map((company) => ({
      id: company._id,
      name: company.name,
      logo: company.logo,
      description: company.industry,
      type: "company",
    }));

    const normalizedBots = bots.map((bot) => ({
      id: bot._id,
      name: bot.name,
      logo: bot.logo_light, // or bot.logo_dark if you prefer
      description: bot.description,
      type: "bot",
    }));

    // Combine both results into a single array
    const combinedResults = [...normalizedCompanies, ...normalizedBots];

    return combinedResults;
  } catch (err) {
    throw err;
  }
};

module.exports = {
  totalInformationAnalyticsService,
  totalIncomeService,
  searchEntitiesServices,
};
