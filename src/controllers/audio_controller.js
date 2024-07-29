const path = require("path");
const fs = require("fs");
const {
  transcriptAnAudio,
  translateAnAudio,
  textToSpeech,
} = require("../services/audio_services");
const { createError } = require("../common/error");

// * Function to transcript an audio
const transcriptAudio = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(createError(400, "Audio not uploaded"));
    }
    const fileLocation = process.env.BULK_FILE_LOCATION;
    if (!fileLocation) {
      return next(createError(400, "env for file location is missing"));
    }
    const fullPath = path.join(
      fileLocation,
      req.file.filename
    );
    const transcript = await transcriptAnAudio(fullPath);
    fs.unlinkSync(fullPath);
    res.status(200).json({ transcript });
  } catch(err) {
    next(err);
  }
};

// * Function to translate an audio
const translateAudio = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(createError(400, "Audio not uploaded"));
    }
    const fileLocation = process.env.BULK_FILE_LOCATION;
    if (!fileLocation) {
      return next(createError(400, "env for file location is missing"));
    }
    const fullPath = path.join(
      fileLocation,
      req.file.filename
    );
    const translate = await translateAnAudio(fullPath);
    fs.unlinkSync(fullPath);
    res.status(200).json({ translate });
  } catch(err) {
    next(err);
  }
};

// * Function to generate an audio from text
const speechFromText = async (req, res, next) => {
  try {
    const fileLocation = process.env.BULK_FILE_LOCATION;
    if (!fileLocation) {
      return next(createError(400, "env for file location is missing"));
    }
    const fullPath = path.join(
      fileLocation,
      'speech.mp3'
    );
    const speechPath = path.resolve(fullPath);
    const message = req?.body?.message;
    const audio = await textToSpeech(message, speechPath);
    fs.exists(speechPath, function (exists) {
      if (exists) {
          // Content-type is very interesting part that guarantee that
          // Web browser will handle response in an appropriate manner.
          res.writeHead(200, {
              "Content-Type": "audio/mpeg",
              "Content-Disposition": "attachment; filename=speech.mp3"
          });
          fs.createReadStream(speechPath).pipe(res);
          return;
      }
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("ERROR File does not exist");
  });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  transcriptAudio,
  translateAudio,
  speechFromText,
};