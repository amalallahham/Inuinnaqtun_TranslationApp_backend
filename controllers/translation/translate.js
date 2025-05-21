import DialectWord from "../../models/dialectWords.js";
import AudioFile from "../../models/audioFile.js";



//Get method for /translate
export const get_translate = async (req, res) => {
  // Checking if user is admin for different nav bar

  if (!req.session || !req.session.adminId) {
    return res.render("translate", {
      error: "",
      title: "Translate",
      isAdmin: false,
      llmEnabled:  process.env.LLM_ENABLED === 'true',
    });
  }

  return res.render("translate", {
    error: "",
    title: "Translate",
    isAdmin: true,
    llmEnabled:  process.env.LLM_ENABLED === 'true',
  });
};

//Post method for /translate
export const translate_text = async (req, res) => {
  //Before translating check if phrase is present in database
  let generatedText = await getDatabaseTranslation(req);
  if (!generatedText) {
    console.log("Phrase not found in database, generating translation");
  }

  console.log(generatedText, 'generatedText')

  const recordedWords = await selectRecordedWords(generatedText);

  res.json({ translation: generatedText, recordedWords: recordedWords });
};

export const getRecordedWords = async (req, res) => {
  console.log(req.params.text, 'selectRecordedWords in getRecordedWords')
  const recordedWords = await selectRecordedWords(req.params.text);
  res.json({ recordedWords: recordedWords });
};

export const getWordDetails = async (req, res) => {
  console.log("Getting word details");
  const word = req.params.word;
  const wordRecord = await DialectWord.findOne({ word: word })
    .sort({ createdAt: -1 })
    .lean();
  if (!wordRecord) {
    res.json({
      success: false,
      error: "This word has not been recorded in our database! ",
    });
    return;
  }

  const audioFiles = await AudioFile.find({
    wordId: wordRecord._id,
  }).lean();

  const audioMap = {};
  audioFiles.forEach((audio) => {
    if (!audioMap[audio.wordId]) {
      audioMap[audio.wordId] = [];
    }
    audioMap[audio.wordId].push(audio.filePath);
  });

  const wordAndAudio = {
    _id: wordRecord?._id,
    word: wordRecord.word,
    translation: wordRecord.translation,
    similarWords: wordRecord.similarWords,
    created_at: wordRecord.createdAt,
    audioFiles: audioMap[wordRecord._id] || [],
  };

  console.log(wordAndAudio);

  res.json({ success: true, details: wordAndAudio });
};


const selectRecordedWords = async (translation) => {
  const allPhrases = extractAllPhrases(translation);
  let searchFilter = { word: { $in: allPhrases } };
  const words = await DialectWord.find(searchFilter)
    .sort({ createdAt: -1 })
    .lean();

  const wordMap = words.map((word) => ({
    _id: word._id,
    word: word.word,
  }));

  let result = {};
  for (const word of wordMap) {
    if (result[word.word]) {
      result[word.word].push(word);
    } else {
      result[word.word] = [word];
    }
  }
  console.log(result, 'result in selectRecordedWords')
  return result;
};

const getDatabaseTranslation = async (req) => {
  const inputLanguage = req.body.sourceLang;
  const text = req.body.text.toLowerCase();
  if (inputLanguage === "Inuinnaqtun") {
    let searchFilter = { word: { $regex: `^${text}$`, $options: "i" } };
    const translations = await DialectWord.find(searchFilter)
      .sort({ createdAt: -1 })
      .lean();
    if (translations[0]) {
      return translations[0].translation[0];
    }
  } else if (inputLanguage === "English") {
    let searchFilter = { translation: { $regex: `^${text}$`, $options: "i" } };
    const translations = await DialectWord.find(searchFilter)
      .sort({ createdAt: -1 })
      .lean();
    if (translations[0]) {
      return translations[0].word;
    }
  }

  return null;
};

const extractAllPhrases = (translation) => {
  console.log(translation)
  const words = translation ? translation.split(" ") : [];
  const phrases = [];

  for (let start = 0; start < words.length; start++) {
    for (let end = start + 1; end <= words.length; end++) {
      let phrase = words.slice(start, end).join(" ");
      const regex = new RegExp(`^${phrase.toLowerCase()}$`, "i");
      phrases.push(regex);
    }
  }

  return phrases;
};





