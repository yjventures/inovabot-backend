const { findRoleByUserId } = require('../services/role_services');
const { createError } = require('../common/error');

const isPermitted = (service_name, api_endpoint) => {
  return (async (req, res, next) => {
    try {
      const currentUserId = req?.user?.id;
      if (!currentUserId) {
        throw createError(400, "User not found from middleware");
      }
      const role = await findRoleByUserId(currentUserId);
      const permission = role.permission[service_name];
      if (!permission[api_endpoint]) {
        throw createError(400, "Don't have permission");
      }
      req.role = role;
      next();
    } catch (err) {
      next(err);
    }
  });
};

module.exports = {
  isPermitted,
};