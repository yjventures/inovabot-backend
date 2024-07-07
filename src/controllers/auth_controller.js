const mongoose = require("mongoose");
const { loginType } = require("../utils/enums");
const { createError } = require("../common/error");
const {
  handleEmailLogin,
  handleRefreshTokenLogin,
} = require("../services/auth_services");

// * Login function
const login = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const email = req?.body?.email;
    const password = req?.body?.password;
    const type = req?.body?.type;
    const refreshToken = req?.body?.refreshToken;
    if (!type) {
      await session.abortTransaction();
      session.endSession();
      return next(createError(404, "Login type not defined"));
    } else if (type === loginType.EMAIL) {
      const user = await handleEmailLogin(email, password, session);
      await session.commitTransaction();
      session.endSession();
      res.status(200).json(user);
    } else if (type === loginType.REFRESH) {
      if (!refreshToken) {
        await session.abortTransaction();
        session.endSession();
        return next(createError(401, "Invalid refresh token"));
      } else {
        const user = await handleRefreshTokenLogin(refreshToken, session);
        await session.commitTransaction();
        session.endSession();
        res.status(200).json(user);
      }
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

module.exports = {
  login,
};
