const mongoose = require("mongoose");
const Package = require("../models/package");
const { createError } = require("../common/error");
const { createProductWithMultiplePrices } = require("../utils/stripe_utils");

// & Function to create a new package
// const createPackage = async (packageObj, session) => {
//   try {
//     //TODO: create a stripe product for this package and put price id in packageObj as stripe_price_id
//     const product = await createProduct(
//       packageObj.name,
//       packageObj.price,
//       packageObj.currency,
//       packageObj.duration
//     );
//     if (!product) {
//       throw createError(500, "Failed to create stripe product");
//     }
//     packageObj.stripe_price_id = product.id;
//     const packageCollection = await new Package(packageObj);
//     const package = await packageCollection.save({ session });
//     if (package) {
//       return package;
//     } else {
//       throw createError(400, "Package couldn't found");
//     }
//   } catch (err) {
//     throw err;
//   }
// };

const createPackage = async (packageObj, session) => {
  try {
    // Ensure that both monthly and yearly prices are provided
    if (!packageObj.price.monthly.price || !packageObj.price.yearly.price) {
      throw new Error("Both monthly and yearly unit amounts must be provided");
    }

    // Create Stripe product and prices
    const { product, monthlyPrice, yearlyPrice } = await createProductWithMultiplePrices(
      packageObj.name,
      parseInt(packageObj.price.monthly.price),
      parseInt(packageObj.price.yearly.price),
      packageObj.price.monthly.currency // Assuming currency is the same for both monthly and yearly prices
    );

    if (!product || !monthlyPrice || !yearlyPrice) {
      throw createError(500, "Failed to create Stripe product or prices");
    }

    // Update packageObj with Stripe price IDs
    packageObj.price.monthly.stripe_id = monthlyPrice.id;
    packageObj.price.yearly.stripe_id = yearlyPrice.id;

    console.log(packageObj)
    // Create and save the package
    const packageCollection = new Package(packageObj);
    const package = await packageCollection.save({ session });

    if (package) {
      return package;
    } else {
      throw createError(400, "Package couldn't be found");
    }
  } catch (err) {
    throw err;
  }
};


// & Function to get packages using querystring
const getPackageUsingQureystring = async (req, session) => {
  try {
    const query = {};
    let page = 1,
      limit = 10;
    let sortBy = "createdAt";
    for (let item in req?.query) {
      if (item === "page") {
        page = Number(req?.query?.page);
        if (isNaN(page)) {
          page = 1;
        }
      } else if (item === "limit") {
        limit = Number(req?.query?.limit);
        if (isNaN(limit)) {
          limit = 10;
        }
      } else if (item === "sortBy") {
        sortBy = req?.query?.sortBy;
      } else if (item === "search") {
        const regex = new RegExp(req.query.search, "i");
        query.name = { $regex: regex };
      } else {
        query[item] = req?.query[item];
      }
    }
    const packages = await Package.find(query)
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(limit)
      .session(session);
    const count = await Package.countDocuments(query, { session });
    return {
      data: packages,
      metadata: {
        totalDocuments: count,
        currentPage: page,
        totalPage: Math.max(1, Math.ceil(count / limit)),
      },
      message: "Success",
    };
  } catch (err) {
    throw createError(404, "Package not found");
  }
};

// & Function to find a package by ID
const findPackageById = async (id, session) => {
  try {
    if (!id) {
      throw createError(400, "Id need to be provided");
    }
    const package = await Package.findById(id).session(session).lean();
    if (package) {
      return package;
    } else {
      throw createError(404, "Package not found");
    }
  } catch (err) {
    throw err;
  }
};

// & Function to update a package by ID
const updatePackageById = async (id, body, session) => {
  try {
    const query = await findPackageById(id, session);

    for (let item in body) {
      if (item === "recurring_date") {
        const date = new Date(body[item]);
        query[item] = date;
      } else if (item === "user_id" || item === "package") {
        query[item] = new mongoose.Types.ObjectId(body[item]);
      } else if (item === "price") {
        // Preserve existing nested fields (like stripe_id) for monthly and yearly
        query[item] = {
          ...query[item], // Preserve existing price fields
          monthly: {
            ...query[item]?.monthly, // Preserve existing monthly fields
            ...body[item]?.monthly,  // Merge updated monthly fields
          },
          yearly: {
            ...query[item]?.yearly,  // Preserve existing yearly fields
            ...body[item]?.yearly,   // Merge updated yearly fields
          },
        };
      } else {
        query[item] = body[item];
      }
    }

    const updatePackage = await Package.findByIdAndUpdate(id, query, {
      new: true,
      session,
    }).lean();

    if (!updatePackage) {
      throw createError(400, "Package not updated");
    } else {
      return { package: updatePackage };
    }
  } catch (err) {
    throw err;
  }
};



// & Function to delete a package by ID
const deletePackageById = async (id, session) => {
  try {
    const deletePackage = await Package.findByIdAndDelete(id).session(session);
    if (!deletePackage) {
      throw createError(404, "Package not found");
    } else {
      return { message: "Package is deleted" };
    }
  } catch (err) {
    throw err;
  }
};

module.exports = {
  createPackage,
  getPackageUsingQureystring,
  findPackageById,
  updatePackageById,
  deletePackageById,
};
