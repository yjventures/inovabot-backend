const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { createError } = require('../common/error');
require('events').EventEmitter.defaultMaxListeners = 100;

const app = express();

app.use(bodyParser.json());
app.use(cors());

// * Logger middleware
app.use((req, res, next) => {
  res.on("finish", () => {
    console.log(req.method, req.hostname, req.path, res.statusCode, res.statusMessage, new Date(Date.now()))
  });
  next();
});

// ? API to check connection to servers (health api)
app.get("/", (req, res, next) => {
  try {
    res.status(200).json({ messge: "Connection established" });
  } catch (err) {
    next(createError());
  }
});

// ~ Router for authentication routes
app.use('/auth', require('../routers/auth_router'));

// ~ Router for user routes
app.use('/users', require('../routers/user_router'));

// ~ Router for password manage
app.use('/password-manager', require('../routers/password_router'));

// ~ Router for company
app.use('/companies', require('../routers/company_router'));

// ~ Router for addresses
app.use('/addresses', require('../routers/address_router'));

// ~ Router for packages
app.use('/packages', require('../routers/package_router'));

// * GLobal error handle middleware
app.use((err, req, res, next) => {
  const errMessage = err.message || "Something went wrong";
  const errStatus = err.status || 500;
  return res.status(errStatus).json({
    status: errStatus,
    message: errMessage,
  });
});

module.exports = app;