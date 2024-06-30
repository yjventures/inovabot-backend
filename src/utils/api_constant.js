const apiEnum = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  REQUEST_SIGNUP: '/request-signup',
  CREATE: '/create',
  GET_ALL: '/get-all',
  GET_BY_ID: '/get/:id',
  UPDATE_BY_ID: '/update/:id',
  DELETE_BY_ID: '/delete/:id',
  FORGET_PASSWORD: '/forget-password', 
  RESET_PASSWORD: '/reset-password',
  VERIFY: '/verify-otp',
  STRIPE_SUBSCRIPTION_INFO: '/subscription-info',
  STRIPE_BILLING_PORTAL: '/subscription-billing-portal',
  STRIPE_UPDATE_INFO: '/update-subscription-info'
};

module.exports = apiEnum;