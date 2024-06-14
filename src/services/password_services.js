const User = require("../models/user");
const { createError } = require("../common/error");
const { hashPassword } = require("../common/manage_pass");
const { manageOtp, updateOtp, deleteOtp, findAOtpUsingObject } = require("./otp_services");
const { SendEmailUtils } = require("../utils/send_email_utils");
const { otpStatus } = require("../utils/enums");

// & Function to request change password
const requestChangePassword = async (info, session) => {
  try {
    if (!info) {
      throw createError(400, "Email not provided");
    } else {
      const otp = await manageOtp(info, session);
      const emailText = `Your password reset varification code is ${otp.otp} .`;
      const emailSubject = `Verification code for reset password in ${process.env.NAME}`;
      const emailStatus = await SendEmailUtils(
        info.email,
        emailText,
        emailSubject
      );
      const emailSent = emailStatus.accepted.find((item) => {
        return item === info.email;
      });
      if (emailSent) {
        return true;
      } else {
        await deleteOtp(otp._id, session);
        throw createError(503, "Email could not be sent");
      }
    }
  } catch (err) {
    throw err;
  }
};

// & Function to verify OTP
const verifyOtp = async (email, code, session) => {
  try {
    if (!email || !code) {
      throw createError(400, "Both email and code need to be provided");
    } else {
      const otp = await findAOtpUsingObject({ email, otp: code, status: otpStatus.UNUSED }, session);
      const updatedOtp = await updateOtp(otp._id, { status: otpStatus.USED }, session);
      return updatedOtp;
    }
  } catch (err) {
    throw err;
  }
};

// & Function to reset password
const resetPassword = async (id, password, session) => {
  try {
    const hash = await hashPassword(password);
    const updateUser = await User.findByIdAndUpdate(
      id,
      { password: hash },
      {
        new: true,
        session,
      }
    ).lean();
    if (!updateUser) {
      throw createError(400, "Password can't be updated");
    } else {
      return updateUser;
    }
  } catch (err) {
    throw err;
  }
};

module.exports = {
  requestChangePassword,
  resetPassword,
  verifyOtp,
};