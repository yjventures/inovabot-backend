const express = require('express');
const apiEnum = require('../utils/api_constant');
const audioController = require('../controllers/audio_controller');
const { authenticateToken } = require("../middlewares/token_authenticator");
const { packageFeature } = require("../middlewares/package_feature");
const { setPathForUploader } = require("../middlewares/file_uploader");

const router = express.Router();
const upload = setPathForUploader();

// ? API to transcript an audio
router.post(
  apiEnum.TRANSCRIPT,
  upload.single("file"),
  audioController.transcriptAudio
);

// ? API to translate an audio
router.post(
  apiEnum.TRANSLATE,
  upload.single("file"),
  audioController.translateAudio
);

// ? API to generate an audio from text
router.post(apiEnum.TEXT_TO_SPEECH, audioController.speechFromText);

module.exports = router;