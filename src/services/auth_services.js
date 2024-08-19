const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { checkHash } = require("../common/manage_pass");
const { createError } = require("../common/error");

// & Generate Access token and Refresh token
const generateTokens = (user) => {
  try {
    const tokenForAccess = jwt.sign(
      {
        email: user.email,
        id: user._id,
        type: user.type,
        company: user.company_id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "10h",
      }
    );
    const tokenForRefresh = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "6d",
    });
    const userJsonObj = user;
    userJsonObj.accessToken = tokenForAccess;
    userJsonObj.refreshToken = tokenForRefresh;
    return userJsonObj;
  } catch (err) {
    throw err;
  }
};

// & Handle Email Login function
const handleEmailLogin = async (email, password, session) => {
  try {
    const user = await User.findOne({ email }).session(session).lean();
    if (user) {
      const isValidPassword = await checkHash(password, user.password);
      if (isValidPassword) {
        const userJsonObj = generateTokens(user);
        return { user: userJsonObj };
      } else {
        throw createError(401, "Invalid password");
      }
    } else {
      throw createError(404, "User not found");
    }
  } catch (err) {
    throw err;
  }
};

// & Handle Refresh Token function
const handleRefreshTokenLogin = async (refreshToken, session) => {
  try {
    const data = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET,
      async (err, payload) => {
        try {
          if (err) {
            throw createError(401, "Unauthorised refresh token");
          } else {
            const { id } = payload;
            const user = await User.findById(id).session(session).lean();
            if (!user) {
              throw createError(401, "Unauthorised user");
            } else {
              const userJsonObj = generateTokens(user);
              return { user: userJsonObj };
            }
          }
        } catch (err) {
          throw err;
        }
      }
    );
    return data;
  } catch (err) {
    throw err;
  }
};

module.exports = {
  handleEmailLogin,
  handleRefreshTokenLogin,
};
