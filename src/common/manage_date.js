const today_date = () => {
  return new Date();
};

// Function to add a specified number of months to a given date
const add_month_with_date = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

// ^ Function to check if the first date has passed the second date
const check_date_for_expire = (date1, date2) => {
  return new Date(date1) > new Date(date2);
};

// ^ Function to convert Unix timestamp to human-readable date in JavaScript
const convertUnixTimestampToDate = (timestamp) => {
  return new Date(timestamp * 1000);
};

module.exports = {
  today_date,
  add_month_with_date,
  check_date_for_expire,
  convertUnixTimestampToDate,
};
