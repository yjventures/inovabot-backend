const loginType = {
  REFRESH: 'refresh',
  EMAIL: 'email',
};

const userType = {
  COMPANY_ADMIN: 'company_admin',
  ADMIN: 'admin',
  USER: 'user',
  REGULAR: 'regular',
};

const otpStatus = {
  UNUSED: 0,
  USED: 1,
  CANCELED: 2,
};

const currency = {
  USD: 'usd',
  GBP: 'gbp',
  EUR: 'eur',
  AUD: 'aud',
  CAD: 'cad',
  INR: 'inr',
  JPY: 'jpy',
  CHF: 'chf',
  MXN: 'mxn',
  NZD: 'nzd',
  ZAR: 'zar',
  SGD:'sgd',
  TRY: 'try',
  BRL: 'brl',
};

const stripeInterval = {
  DAILY: 'day',
  WEEKLY: 'week',
  MONTHLY: 'month',
  ANNUAL: 'year',
};

const employeeType = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  SUPERVISOR:'supervisor',
};

module.exports = {
  loginType,
  userType,
  otpStatus,
  currency,
  stripeInterval,
  employeeType,
};
