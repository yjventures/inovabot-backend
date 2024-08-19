const moment = require("moment");
const Bot = require("../models/bot");
const Company = require("../models/company");
const File = require("../models/file");

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

module.exports = {
  totalInformationAnalyticsService,
};
