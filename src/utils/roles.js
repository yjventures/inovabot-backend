const { serviceName } = require("../utils/enums");
const apiEnum = require('../utils/api_constant');

const precidency = {
  superAdmin: 50,
  admin: 40,
  reseller: 30,
  companyAdmin: 20,
  user: 10
}

const superAdmin = {
  [serviceName.BOT_SERVICE]: {
    [apiEnum.CREATE]: true,
    [apiEnum.GET_ALL]: true,
    [apiEnum.GET_BY_ID]: true,
    [apiEnum.UPDATE_BY_ID]: true,
    [apiEnum.DELETE_BY_ID]: true,
    [apiEnum.UPLOAD]: true,
    [apiEnum.DELETE_FILE]: true,
  },
  [serviceName.COMPANY_SERVICE]: {
    [apiEnum.CREATE]: true,
    [apiEnum.GET_ALL]: true,
    [apiEnum.GET_BY_ID]: true,
    [apiEnum.UPDATE_BY_ID]: true,
    [apiEnum.DELETE_BY_ID]: true,
  },
  [serviceName.FILE_SERVICE]: {
    [apiEnum.GET_ALL]: true,
    [apiEnum.GET_BY_ID]: true,
  },
  [serviceName.INVITATION_SERVICE]: {
    [apiEnum.CREATE]: true,
    [apiEnum.CHECK_PASSWORD]: true,
  },
  [serviceName.PACKAGE_SERVICE]: {
    [apiEnum.CREATE]: true,
    [apiEnum.GET_ALL]: true,
    [apiEnum.GET_BY_ID]: true,
    [apiEnum.UPDATE_BY_ID]: true,
    [apiEnum.DELETE_BY_ID]: true,
  },
  [serviceName.THREAD_SERVICE]: {
    [apiEnum.CREATE]: true,
    [apiEnum.GET_ALL]: true,
    [apiEnum.GET_BY_ID]: true,
    [apiEnum.UPDATE_BY_ID]: true,
    [apiEnum.DELETE_BY_ID]: true,
    [apiEnum.UPLOAD]: true,
    [apiEnum.DELETE_FILE]: true,
  },
  [serviceName.SUBSCRIPTION_SERVICE]: {
    [apiEnum.CREATE]: true,
    [apiEnum.GET_ALL]: true,
    [apiEnum.STRIPE_BILLING_PORTAL]: true,
    [apiEnum.STRIPE_UPDATE_INFO]: true,
    [apiEnum.STRIPE_SUBSCRIPTION_INFO]: true,
  },
  [serviceName.USER_SERVICE]: {
    [apiEnum.REQUEST_SIGNUP]: true,
    [apiEnum.SIGNUP]: true,
    [apiEnum.GET_ALL]: true,
    [apiEnum.GET_BY_ID]: true,
    [apiEnum.UPDATE_BY_ID]: true,
    [apiEnum.DELETE_BY_ID]: true,
  },
};

const admin = {
  [serviceName.BOT_SERVICE]: {
    [apiEnum.CREATE]: true,
    [apiEnum.GET_ALL]: true,
    [apiEnum.GET_BY_ID]: true,
    [apiEnum.UPDATE_BY_ID]: true,
    [apiEnum.DELETE_BY_ID]: true,
    [apiEnum.UPLOAD]: true,
    [apiEnum.DELETE_FILE]: true,
  },
  [serviceName.COMPANY_SERVICE]: {
    [apiEnum.CREATE]: true,
    [apiEnum.GET_ALL]: true,
    [apiEnum.GET_BY_ID]: true,
    [apiEnum.UPDATE_BY_ID]: true,
    [apiEnum.DELETE_BY_ID]: true,
  },
  [serviceName.FILE_SERVICE]: {
    [apiEnum.GET_ALL]: true,
    [apiEnum.GET_BY_ID]: true,
  },
  [serviceName.INVITATION_SERVICE]: {
    [apiEnum.CREATE]: true,
    [apiEnum.CHECK_PASSWORD]: true,
  },
  [serviceName.PACKAGE_SERVICE]: {
    [apiEnum.CREATE]: true,
    [apiEnum.GET_ALL]: true,
    [apiEnum.GET_BY_ID]: true,
    [apiEnum.UPDATE_BY_ID]: true,
    [apiEnum.DELETE_BY_ID]: true,
  },
  [serviceName.THREAD_SERVICE]: {
    [apiEnum.CREATE]: true,
    [apiEnum.GET_ALL]: true,
    [apiEnum.GET_BY_ID]: true,
    [apiEnum.UPDATE_BY_ID]: true,
    [apiEnum.DELETE_BY_ID]: true,
    [apiEnum.UPLOAD]: true,
    [apiEnum.DELETE_FILE]: true,
  },
  [serviceName.SUBSCRIPTION_SERVICE]: {
    [apiEnum.CREATE]: true,
    [apiEnum.GET_ALL]: true,
    [apiEnum.STRIPE_BILLING_PORTAL]: true,
    [apiEnum.STRIPE_UPDATE_INFO]: true,
    [apiEnum.STRIPE_SUBSCRIPTION_INFO]: true,
  },
  [serviceName.USER_SERVICE]: {
    [apiEnum.REQUEST_SIGNUP]: true,
    [apiEnum.SIGNUP]: true,
    [apiEnum.GET_ALL]: true,
    [apiEnum.GET_BY_ID]: true,
    [apiEnum.UPDATE_BY_ID]: true,
    [apiEnum.DELETE_BY_ID]: true,
  },
};

const companyAdmin = {
  [serviceName.BOT_SERVICE]: {
    [apiEnum.CREATE]: true,
    [apiEnum.GET_ALL]: true,
    [apiEnum.GET_BY_ID]: true,
    [apiEnum.UPDATE_BY_ID]: true,
    [apiEnum.DELETE_BY_ID]: true,
    [apiEnum.UPLOAD]: true,
    [apiEnum.DELETE_FILE]: true,
  },
  [serviceName.COMPANY_SERVICE]: {
    [apiEnum.CREATE]: true,
    [apiEnum.GET_ALL]: true,
    [apiEnum.GET_BY_ID]: true,
    [apiEnum.UPDATE_BY_ID]: true,
    [apiEnum.DELETE_BY_ID]: true,
  },
  [serviceName.FILE_SERVICE]: {
    [apiEnum.GET_ALL]: true,
    [apiEnum.GET_BY_ID]: true,
  },
  [serviceName.INVITATION_SERVICE]: {
    [apiEnum.CREATE]: true,
    [apiEnum.CHECK_PASSWORD]: true,
  },
  [serviceName.PACKAGE_SERVICE]: {
    [apiEnum.CREATE]: true,
    [apiEnum.GET_ALL]: true,
    [apiEnum.GET_BY_ID]: true,
    [apiEnum.UPDATE_BY_ID]: true,
    [apiEnum.DELETE_BY_ID]: true,
  },
  [serviceName.THREAD_SERVICE]: {
    [apiEnum.CREATE]: true,
    [apiEnum.GET_ALL]: true,
    [apiEnum.GET_BY_ID]: true,
    [apiEnum.UPDATE_BY_ID]: true,
    [apiEnum.DELETE_BY_ID]: true,
    [apiEnum.UPLOAD]: true,
    [apiEnum.DELETE_FILE]: true,
  },
  [serviceName.SUBSCRIPTION_SERVICE]: {
    [apiEnum.CREATE]: true,
    [apiEnum.GET_ALL]: true,
    [apiEnum.STRIPE_BILLING_PORTAL]: true,
    [apiEnum.STRIPE_UPDATE_INFO]: true,
    [apiEnum.STRIPE_SUBSCRIPTION_INFO]: true,
  },
  [serviceName.USER_SERVICE]: {
    [apiEnum.REQUEST_SIGNUP]: true,
    [apiEnum.SIGNUP]: true,
    [apiEnum.GET_ALL]: true,
    [apiEnum.GET_BY_ID]: true,
    [apiEnum.UPDATE_BY_ID]: true,
    [apiEnum.DELETE_BY_ID]: true,
  },
};

const reseller = {
  [serviceName.BOT_SERVICE]: {
    [apiEnum.CREATE]: true,
    [apiEnum.GET_ALL]: true,
    [apiEnum.GET_BY_ID]: true,
    [apiEnum.UPDATE_BY_ID]: true,
    [apiEnum.DELETE_BY_ID]: true,
    [apiEnum.UPLOAD]: true,
    [apiEnum.DELETE_FILE]: true,
  },
  [serviceName.COMPANY_SERVICE]: {
    [apiEnum.CREATE]: true,
    [apiEnum.GET_ALL]: true,
    [apiEnum.GET_BY_ID]: true,
    [apiEnum.UPDATE_BY_ID]: true,
    [apiEnum.DELETE_BY_ID]: true,
  },
  [serviceName.FILE_SERVICE]: {
    [apiEnum.GET_ALL]: true,
    [apiEnum.GET_BY_ID]: true,
  },
  [serviceName.INVITATION_SERVICE]: {
    [apiEnum.CREATE]: true,
    [apiEnum.CHECK_PASSWORD]: true,
  },
  [serviceName.PACKAGE_SERVICE]: {
    [apiEnum.CREATE]: true,
    [apiEnum.GET_ALL]: true,
    [apiEnum.GET_BY_ID]: true,
    [apiEnum.UPDATE_BY_ID]: true,
    [apiEnum.DELETE_BY_ID]: true,
  },
  [serviceName.THREAD_SERVICE]: {
    [apiEnum.CREATE]: true,
    [apiEnum.GET_ALL]: true,
    [apiEnum.GET_BY_ID]: true,
    [apiEnum.UPDATE_BY_ID]: true,
    [apiEnum.DELETE_BY_ID]: true,
    [apiEnum.UPLOAD]: true,
    [apiEnum.DELETE_FILE]: true,
  },
  [serviceName.SUBSCRIPTION_SERVICE]: {
    [apiEnum.CREATE]: true,
    [apiEnum.GET_ALL]: true,
    [apiEnum.STRIPE_BILLING_PORTAL]: true,
    [apiEnum.STRIPE_UPDATE_INFO]: true,
    [apiEnum.STRIPE_SUBSCRIPTION_INFO]: true,
  },
  [serviceName.USER_SERVICE]: {
    [apiEnum.REQUEST_SIGNUP]: true,
    [apiEnum.SIGNUP]: true,
    [apiEnum.GET_ALL]: true,
    [apiEnum.GET_BY_ID]: true,
    [apiEnum.UPDATE_BY_ID]: true,
    [apiEnum.DELETE_BY_ID]: true,
  },
};

const user = {
  [serviceName.BOT_SERVICE]: {
    [apiEnum.CREATE]: true,
    [apiEnum.GET_ALL]: true,
    [apiEnum.GET_BY_ID]: true,
    [apiEnum.UPDATE_BY_ID]: true,
    [apiEnum.DELETE_BY_ID]: true,
    [apiEnum.UPLOAD]: true,
    [apiEnum.DELETE_FILE]: true,
  },
  [serviceName.COMPANY_SERVICE]: {
    [apiEnum.CREATE]: true,
    [apiEnum.GET_ALL]: true,
    [apiEnum.GET_BY_ID]: true,
    [apiEnum.UPDATE_BY_ID]: true,
    [apiEnum.DELETE_BY_ID]: true,
  },
  [serviceName.FILE_SERVICE]: {
    [apiEnum.GET_ALL]: true,
    [apiEnum.GET_BY_ID]: true,
  },
  [serviceName.INVITATION_SERVICE]: {
    [apiEnum.CREATE]: true,
    [apiEnum.CHECK_PASSWORD]: true,
  },
  [serviceName.PACKAGE_SERVICE]: {
    [apiEnum.CREATE]: true,
    [apiEnum.GET_ALL]: true,
    [apiEnum.GET_BY_ID]: true,
    [apiEnum.UPDATE_BY_ID]: true,
    [apiEnum.DELETE_BY_ID]: true,
  },
  [serviceName.THREAD_SERVICE]: {
    [apiEnum.CREATE]: true,
    [apiEnum.GET_ALL]: true,
    [apiEnum.GET_BY_ID]: true,
    [apiEnum.UPDATE_BY_ID]: true,
    [apiEnum.DELETE_BY_ID]: true,
    [apiEnum.UPLOAD]: true,
    [apiEnum.DELETE_FILE]: true,
  },
  [serviceName.SUBSCRIPTION_SERVICE]: {
    [apiEnum.CREATE]: true,
    [apiEnum.GET_ALL]: true,
    [apiEnum.STRIPE_BILLING_PORTAL]: true,
    [apiEnum.STRIPE_UPDATE_INFO]: true,
    [apiEnum.STRIPE_SUBSCRIPTION_INFO]: true,
  },
  [serviceName.USER_SERVICE]: {
    [apiEnum.REQUEST_SIGNUP]: true,
    [apiEnum.SIGNUP]: true,
    [apiEnum.GET_ALL]: true,
    [apiEnum.GET_BY_ID]: true,
    [apiEnum.UPDATE_BY_ID]: true,
    [apiEnum.DELETE_BY_ID]: true,
  },
};

module.exports = {
  precidency,
  superAdmin,
  admin,
  reseller,
  companyAdmin,
  user,
}