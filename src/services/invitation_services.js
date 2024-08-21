const mongoose = require("mongoose");
const tempPasswordModel = require("../models/tempPassword");
const User = require("../models/user");
const { generateLinkForTeamMember } = require("../utils/invitation");
const { SendEmailUtils } = require("../utils/send_email_utils");
const generator = require("generate-password");
const { createError } = require("../common/error");
const roles = require("../utils/roles");
const { createRole } = require("./role_services");
const { userType, userRoleType } = require("../utils/enums");

const createUserService = async (req, session) => {
  const reqBody = req.body;

  if (!reqBody.email) {
    throw createError(400, "Email must be provided");
  }

  try {
    const user = await User.findOne({ email: reqBody.email }).session(session);
    if (user) {
      throw createError(400, "User already Exist");
    }

    const passwordCode = generator.generate({
      length: 20,
      numbers: true,
    });

    // Construct the new user object with necessary details
    const newUser = {
      name: reqBody.name,
      email: reqBody.email,
      password: passwordCode,
      phone: reqBody.phone || "",
      image: reqBody.image || "",
      birthdate: reqBody.birthdate || null,
      type: reqBody.type,
      last_subscribed: reqBody.last_subscribed || null,
      expires_at: reqBody.expires_at || null,
      company_position: reqBody.company_position || null,
    };

    if (req?.body?.company_id) {
      newUser.company_id = new mongoose.Types.ObjectId(reqBody.company_id);
      newUser.has_company = req?.body?.has_company || null;
    }

    // Create the new user within the transaction session
    const createdUserCollection = await new User(newUser);
    const createUser = await createdUserCollection.save({ session });

    // console.log("create user ", createUser)

    // Check if the user was successfully created
    // const userCount = await User.aggregate([
    //   { $match: { email: reqBody.email } },
    //   { $count: "total" },
    // ]);

    // console.log("user Count", userCount)

    if (createUser) {
      let permission = {};
      if (reqBody.type === userType.ADMIN) {
        permission = roles.admin;
      } else if (reqBody.type === userType.RESELLER) {
        permission = roles.reseller;
      } else if (reqBody.type === userType.USER) {
        if (reqBody?.role === userRoleType.EDITOR) {
          permission = roles.editor;
        } else {
          permission = roles.viewer;
        }
      }
      const roleBody = {
        name: reqBody.type,
        user_id: createUser._id,
        permission,
      };
      const role = await createRole(roleBody, session);
      if (!role) {
        throw createError(400, "Role not assigned");
      }

      // Insert OTP into the database
      const tempPass = {
        email: reqBody.email,
        password: passwordCode,
      };
      const tempPasswordCollection = new tempPasswordModel(tempPass);
      await tempPasswordCollection.save({ session });

      const confirmationToken = generateLinkForTeamMember(reqBody.email);

      // Send a confirmation email to the user
      const emailMessage = `Your temporary password is ${passwordCode}.<br/> Click here to confirm your invitation: ${confirmationToken}`;
      const emailSubject = "Account Confirmation";
      const emailSend = await SendEmailUtils(
        reqBody.email,
        emailMessage,
        emailSubject
      );

      createUser.password = undefined; // Remove password from the response
      return {
        user: createUser,
        code: confirmationToken,
        pass: passwordCode,
        emailInfo: emailSend,
        message: "success",
      };
    } else {
      throw createError(500, "User creation failed");
    }
  } catch (err) {
    throw err;
  }
};

const checkTempPassword = async (req, session) => {
  const { email, password } = req.body;

  // Find the user by email and password
  const user = await User.findOne({ email, password }).session(session);

  if (!user) {
    throw new Error("Invalid Password.");
  }

  const status = 0;

  const passwordCount = await tempPasswordModel.aggregate([
    { $match: { email, password, status } },
    { $count: "total" },
  ]);

  if (passwordCount.length > 0) {
    await tempPasswordModel.updateOne(
      { email, password, status },
      { email, password, status: 1 },
      { session }
    );

    return user;
  } else {
    throw new Error("Invalid OTP.");
  }
};

module.exports = { createUserService, checkTempPassword };
