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
}

module.exports = {
  loginType,
  userType,
  otpStatus,
};
