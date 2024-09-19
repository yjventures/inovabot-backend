const moment = require("moment");
const Bot = require("../models/bot");
const Company = require("../models/company");
const File = require("../models/file");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// const axios = require('axios');
const { createError } = require('../common/error');
require("dotenv").config();
// OpenAI API key
const OPENAI_API_KEY = process.env.OPENAI_API;


const totalInformationAnalyticsService = async (filter, session) => {
  try {
    console.log("filter", filter);
    let startDate, endDate;

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
      Bot.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      Company.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      File.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
    ]);

    const startOfToday = moment().startOf("day").toDate();

    // Get the end of today
    const endOfToday = moment().endOf("day").toDate();

    const [todayBotCount, todayCompanyCount, todayFileCount] =
      await Promise.all([
        Bot.countDocuments({
          createdAt: { $gte: startOfToday, $lte: endOfToday },
        }),
        Company.countDocuments({
          createdAt: { $gte: startOfToday, $lte: endOfToday },
        }),
        File.countDocuments({
          createdAt: { $gte: startOfToday, $lte: endOfToday },
        }),
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
        }),
        Company.countDocuments({
          createdAt: { $gte: startOfYesterday, $lte: endOfYesterday },
        }),
        File.countDocuments({
          createdAt: { $gte: startOfYesterday, $lte: endOfYesterday },
        }),
      ]);

    const botDifferent = todayBotCount - botCountYesterday;
    const comapanyDifferent = todayFileCount - companyCountYesterday;
    const fileDifferent = todayCompanyCount - fileCountYesterday;

    return {
      botCount,
      companyCount,
      fileCount,
      botDifferent,
      comapanyDifferent,
      fileDifferent,
    };
  } catch (err) {
    throw err;
  }
};

// const totalIncomeService = async ()=>{
//   try {
//     // Fetch balance
//     const balance = await stripe.balance.retrieve();

//     // Available balance (funds ready for payout)
//     const availableBalance = balance.available.reduce((total, bal) => {
//       if (bal.currency === 'usd') {
//         return total + bal.amount;
//       }
//       return total;
//     }, 0);

//     const available = availableBalance / 100;

//     //this is for open ai costs
//     console.log(OPENAI_API_KEY)

//     const response = await axios.get('https://api.openai.com/v1/usage', {
//       headers: {
//         'Authorization': `Bearer ${OPENAI_API_KEY}`,
//       },
//     });

//     console.log('Usage Data:', response.data);


//     return {
//      available
//     };
//   } catch (error) {
//     console.log(error.message)
//     throw createError(400, "Error fetching total income from Stripe", error.message);
//   }
// }



const searchEntitiesServices = async (query) => {
  const regex = new RegExp(query, 'i'); // 'i' makes it case-insensitive

  // Search for companies and bots using the regex
  const companies = await Company.find({ name: { $regex: regex } }).select('name logo industry');
  const bots = await Bot.find({ name: { $regex: regex } }).select('name logo_light description');

  // Normalize the data to a common format
  const normalizedCompanies = companies.map(company => ({
    id: company._id,
    name: company.name,
    logo: company.logo,
    description: company.industry,
    type: 'company',
  }));

  const normalizedBots = bots.map(bot => ({
    id: bot._id,
    name: bot.name,
    logo: bot.logo_light, // or bot.logo_dark if you prefer
    description: bot.description,
    type: 'bot',
  }));

  // Combine both results into a single array
  const combinedResults = [...normalizedCompanies, ...normalizedBots];

  return combinedResults;
};


module.exports = {
  totalInformationAnalyticsService,
  // totalIncomeService, 
  searchEntitiesServices
};
