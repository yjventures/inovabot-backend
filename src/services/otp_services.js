const otpGenerator = require("otp-generator");
const Otp = require("../models/otp");
const { otpStatus } = require("../utils/enums");
const { createError } = require("../common/error");

const findAOtpUsingObject = async (body, session) => {
  try {
    const otp = await Otp.findOne(body).session(session).lean();
    if (!otp) {
      throw createError(404, "Invalid OTP code");
    } else {
      return otp;
    }
  } catch (err) {
    throw err;
  }
}

const manageOtp = async (body, session) => {
  try {
    body.status = otpStatus.UNUSED;
    const previousOtps = await Otp.find(body).session(session);
    if (previousOtps.length > 0 ) {
      for (let item of previousOtps) {
        await Otp.findByIdAndUpdate(item._id, {status: otpStatus.CANCELED}, { new: true, session});
      }
    }
    const verificationCode = otpGenerator.generate(4, {
      digits: true,
      alphabets: false,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    });
    const otp = await new Otp({ ...body, otp: verificationCode });
    await otp.save({ session });
    if (!otp) {
      throw createError(400, "Cannot create a new Otp");
    } else {
      return otp;
    }
  } catch (err) {
    throw err;
  }
};

const updateOtp = async (id, body, session) => {
  try {
    const otp = await Otp.findByIdAndDelete(id, body, { new: true, session }).lean();
    if (!otp) {
      throw createError(400, "Couldn't validate OTP");
    } else {
      return otp;
    }
  } catch (err) {
    throw err;
  }
};

const deleteOtp = async (id, session) => {
  try {
    const otp = await findByIdAndDelete(id, { session }).lean();
    if (!otp) {
      throw createError(400, "Otp not deleted");
    } else {
      return true;
    }
  } catch (err) {
    throw err;
  }
};

module.exports = {
  manageOtp,
  updateOtp,
  deleteOtp,
  findAOtpUsingObject,
};