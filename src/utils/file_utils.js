function convertToBytes(input) {
  const units = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024,
  };

  // Extract the numerical part and the unit part from the string
  const match = input.match(/(\d+)([a-zA-Z]+)/);
  
  if (!match) {
    throw new Error("Invalid input format");
  }

  const value = parseInt(match[1], 10); // the numerical part
  const unit = match[2].toUpperCase(); // the unit part

  if (!units[unit]) {
    throw new Error("Unknown unit");
  }

  return value * units[unit];
};

module.exports = {
  convertToBytes,
};