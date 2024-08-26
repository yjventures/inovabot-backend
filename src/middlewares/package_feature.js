const Package = require("../models/package");
const Subscription = require("../models/subscription");
const User = require("../models/user");
const Company = require("../models/company");

const formatValue = (val)=>{
  if (val === 'true' || val === "Yes") {
    return true;
  } else if (val === 'false' || val === "No") {
    return false;
  } else if (val === 'undefined') {
    return undefined;
  } else if (val === 'null') {
    return null;
  } 
  return val;
}
const packageFeature = async (req, res, next) => {
  try {
    const currentUser = req?.user;
    if (!currentUser?.id) {
      return res.status(401).json({ message: "User is required" });
    }
    const user = await User.findById(currentUser.id).lean();
    if (!user) {
      return res.status(404).json({ message: "User not exist" });
    }

    let company = null;
    if (req?.body?.company_id) {
      company = await Company.findById(req.body.company_id);
    } else {
      company = await Company.find({ user_id: user._id });
    }

    if (!company) {
      return res.status(404).json({ message: "User company not found" });
    }

    const subscription = await Subscription.findOne({
      company_id: company._id,
    }).lean();

    if (!subscription) {
      return res.status(404).json({ message: "User subscription not found" });
    }

    const package = await Package.findById(subscription.package_id).lean();

    if (!package) {
      return res.status(404).json({ message: "Package not found" });
    }

    const features = package.features;
    const value = {};

    for (let feature of features) {
      value[feature.keyword] = formatValue(feature.value);
    }

    req.body.package = {
      ...package,
      ...value,
    };
    // console.log(req.body.package);

    next();
  } catch (error) {
    // console.error("Error in findFeatureMiddleware:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { packageFeature };

/*
  use this like any where for find any feature value
  const feature1Value = package.value['feature1'];
*/
