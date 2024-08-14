const loginType = {
  REFRESH: 'refresh',
  EMAIL: 'email',
};

const userType = {
  SUPER_ADMIN: 'super-admin',
  COMPANY_ADMIN: 'company-admin',
  ADMIN: 'admin',
  USER: 'user',
  RESELLER: 'reseller',
};

const userRoleType = {
  EDITOR: 'editor',
  VIEWER: 'viewer',
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

const serviceName = {
  AUDIO_SERVICE: 'audio-service',
  AUTH_SERVICE: 'auth-service',
  BOT_SERVICE: 'bot-service',
  COMPANY_SERVICE: 'company-service',
  FILE_SERVICE: 'file-service',
  INVITATION_SERVICE: 'invitation-service',
  OTP_SERVICE: 'otp-service',
  PACKAGE_SERVICE: 'package-service',
  PASSWORD_SERVICE: 'password-service',
  SUBSCRIPTION_SERVICE: 'subscription-service',
  THREAD_SERVICE: 'thread-service',
  USER_SERVICE: 'user-service',
};

module.exports = {
  loginType,
  userType,
  userRoleType,
  otpStatus,
  currency,
  stripeInterval,
  employeeType,
  serviceName,
};
