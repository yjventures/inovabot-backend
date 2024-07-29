const crypto = require("crypto");
const { createError } = require("../common/error");

// ^ Function to generate verification link through encription
const generateVerificationLink = (user) => {
  try {
    let secretKey = process.env.CRYPTO_SECRET;
    const cipher = crypto.createCipher('aes-256-cbc', secretKey);
    let encryptedUser = cipher.update(JSON.stringify(user), 'utf-8', 'hex');
    encryptedUser += cipher.final('hex');
    
    const confirmationLink = `${process.env.REGISTER_REDIRECT_URL}${encodeURIComponent(encryptedUser)}`;
    return confirmationLink;
  } catch (err) { 
    throw createError(400, 'Error generate verification link');
  }
};

// ^ Function to decrypt link
const decryptLink = (link) => {
  try {
    let secretKey = process.env.CRYPTO_SECRET;
    const cipher = crypto.createDecipher('aes-256-cbc', secretKey);
    let decryptedUser = cipher.update(link, 'hex', 'utf-8');
    decryptedUser += cipher.final('utf-8');
    return JSON.parse(decryptedUser);
  } catch (err) {
    throw createError(400, 'Error generate verification link');
  }
};

module.exports = {
  generateVerificationLink,
  decryptLink
}