const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { createError } = require('../common/error');
require('events').EventEmitter.defaultMaxListeners = 100;

const app = express();

app.use('/webhook', bodyParser.raw({ type: '*/*' }));
// app.use(bodyParser.raw({ type: '*/*' }))
app.use(bodyParser.json());
app.use(cors());

// * Setting streaming for openAI
app.use((req, res, next) => {
  res.sseSetup = () => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
  };

  res.sseSend = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  res.sseStop = () => {
    res.end();
  }

  next();
});

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

// ~ Router for subscription
app.use('/subscription', require('../routers/subscription_router'));

// ~ Router for bot
app.use('/bots', require('../routers/bot_router'));

// ~ Router for thread
app.use('/threads', require('../routers/thread_router'));

// ~ Router for subscription
app.use('/invitation', require('../routers/invitation_router'));

// ~ Router for audio
app.use('/audios', require('../routers/audio_router'));

// ~ Router for file
app.use('/files', require('../routers/file_router'));

// ~ Router for analytics
app.use('/dashboard', require('../routers/dashboard_router'));

// ~ Router for categories
app.use('/categories', require('../routers/category_router'));

// ~ Router for faqs
app.use('/faqs', require('../routers/faq_router'));

// ~ Router for links
app.use('/links', require('../routers/link_router'));

// ~ Router for images
app.use('/images', require('../routers/image_router'));

// ~ Router for templates
app.use('/templates', require('../routers/template_router'));

// ~ Router for dashboard
app.use('/dashboards', require('../routers/dashboard_router'));

// * GLobal error handle middleware
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  
  const errMessage = err.message || "Something went wrong";
  const errStatus = err.status || 500;
  return res.status(errStatus).json({
    status: errStatus,
    message: errMessage,
  });
});

module.exports = app;