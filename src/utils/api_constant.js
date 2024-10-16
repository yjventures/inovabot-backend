const apiEnum = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  REQUEST_SIGNUP: '/request-signup',
  CREATE: '/create',
  GET_ALL: '/get-all',
  GET_LIST: '/get-list',
  GET_BY_ID: '/get/:id',
  GET_BY_URL: '/get-by-url/:url',
  UPDATE: '/update',
  UPDATE_BY_ID: '/update/:id',
  DELETE_BY_ID: '/delete/:id',
  UPDATE_ROLE: '/update-role',
  FORGET_PASSWORD: '/forget-password', 
  RESET_PASSWORD: '/reset-password',
  CHECK_PASSWORD: '/check-password',
  VERIFY: '/verify-otp',
  STRIPE_SUBSCRIPTION_INFO: '/subscription-info',
  STRIPE_BILLING_PORTAL: '/subscription-billing-portal',
  STRIPE_UPDATE_INFO: '/update-subscription-info',
  WEBHOOK: '/webhook',
  GET_THREAD: '/get-thread',
  RUN_THREAD_BY_ID: '/run/:id',
  STOP_THREAD: '/stop-thread',
  GET_MESSAGE_LIST_BY_ID: '/messages/:id',
  UPLOAD: '/upload',
  DELETE_FILE: '/delete-file',
  TRANSCRIPT: '/transcript',
  TRANSLATE: '/translate',
  TEXT_TO_SPEECH: '/text-to-speech',
  INVITE_ADMIN: '/invite-admin',
  INVITE_USER: '/invite-user',
  INVITE_RESELLER: '/invite-reseller',
  ANALYTICS_TOTAL_DATA: '/analytics',
  INVITE_COMPANY_ADMIN: '/invite-company-admin',
  GET_STORAGE: '/get-storage',
  UPGRADE_DOWNGRADE_SUBSCRIPTION: '/update',
  CANCEL_SUBSCRIPTION: '/cancel',
  TOTAL_INCOME: '/total-income',
  DASHBOARD_SEARCH: '/dashboard-search',
  RUN_CHAT_COMPLETION: '/run-chat-completion',
};

module.exports = apiEnum;