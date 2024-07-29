const {
  transcriptAudio,
  translateAudio,
  createAudioFromText,
} = require("../utils/open_ai_utils");
const { createError } = require("../common/error");

// & Function to transcript an audio
const transcriptAnAudio = async (file_path) => {
  try {
    const transcript = await transcriptAudio(file_path);
    if (!transcript) {
      throw createError(400, "Couldn't create transcript");
    }
    return transcript;
  } catch (err) {
    throw err;
  }
};

// & Function to translate an audio
const translateAnAudio = async (file_path) => {
  try {
    const translate = await translateAudio(file_path);
    if (!translate) {
      throw createError(400, "Couldn't create translate");
    }
    return translate;
  } catch (err) {
    throw err;
  }
};

// & Function to generate an audio from text
const textToSpeech = async (message, path) => {
  try {
    const audio = await createAudioFromText(message, path);
    if (!audio) {
      throw createError(400, "Couldn't create audio");
    }
    return audio;
  } catch (err) {
    throw err;
  }
};

module.exports = {
  transcriptAnAudio,
  translateAnAudio,
  textToSpeech,
};