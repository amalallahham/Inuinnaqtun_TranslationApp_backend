import DialectWord from "../../models/dialectWords.js";
import AudioFile from "../../models/audioFile.js";

import ort from 'onnxruntime-node';
import { AutoTokenizer } from '@xenova/transformers';

//Get method for /translate
export const get_translate = async (req, res) => {
  // Checking if user is admin for different nav bar
  if (!req.session || !req.session.adminId) {
    res.render("translate", { error: "", title: "Translate", isAdmin: false });
  }
  res.render("translate", { error: "", title: "Translate", isAdmin: true });
};

//Post method for /translate
export const translate_text = async (req, res) => {
  const maxLength = 300;
  const vocabSize = 32128;
  const padToken = 0;
  const endOfSequence = 1;

  //Prompt given to model
  const prompt = createPrompt(req);

  //Load model and tokenizer
  const [session, tokenizer] = await Promise.all([
    ort.InferenceSession.create('LLM/EchoOfTheNorth_model.onnx'),
    AutoTokenizer.from_pretrained('tokenizer', {
      local_files_only: true,
      cache_dir: 'LLM/',
    })
  ]);

  //Tokenize and pad/truncate input
  const tokens = await tokenize(prompt, tokenizer);
  let inputIds = createInputArray(tokens, maxLength, padToken);
  let inputMask = createInputMask(inputIds, padToken);

  //Create feeds for the model
  let input_ids = new ort.Tensor("int32", new Int32Array(inputIds), [1, inputIds.length]);
  let attention_mask = new ort.Tensor("int32", new Int32Array(inputMask), [1, inputIds.length]);

  //Base arrays for decoder inputs
  let decoderInputIdsArray = [padToken];
  let decoderAttentionMaskArray = [1];
  let generatedTokens = [];

  for (let step = 0; step < maxLength; step++) {
    //Create decoder input and mask
    let decoder_input_ids = new ort.Tensor('int32', new Int32Array(decoderInputIdsArray), [1, decoderInputIdsArray.length]);
    let decoder_attention_mask = new ort.Tensor('int32', new Int32Array(decoderAttentionMaskArray), [1, decoderAttentionMaskArray.length]);

    //Organize feeds
    const feeds = {
      "input_ids": input_ids,
      "attention_mask": attention_mask,
      "decoder_input_ids": decoder_input_ids,
      "decoder_attention_mask": decoder_attention_mask
    };

    //Generate output logit and find predicted toke
    const results = await session.run(feeds);
    const predictedToken = extractPredictedToken(results.logits.data, vocabSize, decoderInputIdsArray.length);

    // Add predicted token to total sequence and edit decoder feeds
    generatedTokens.push(predictedToken);
    decoderInputIdsArray.push(predictedToken);
    decoderAttentionMaskArray.push(1);

    // Stop generation once the end sequence token is reached
    if (predictedToken === endOfSequence) {
      break;
    }
  }

  //Detokenize model output into text and send as json response
  const generatedText = await detokenize(generatedTokens, tokenizer);
  const recordedWords = await selectRecordedWords(generatedText);
  res.json({ translation: generatedText, recordedWords: recordedWords });
}

export const getWordDetails = async (req, res) => {
  const wordId = req.params.id;
  const word = await DialectWord.findById(wordId)
    .lean();
  
  if(!word){
    res.json({success: false, error: "This word has not been recorded in our database! "})
    return;
  }

  const audioFiles = await AudioFile.find({
    wordId: wordId,
  }).lean();

  const audioMap = {};
  audioFiles.forEach((audio) => {
    if (!audioMap[audio.wordId]) {
      audioMap[audio.wordId] = [];
    }
    audioMap[audio.wordId].push(audio.filePath);
  });

  const wordAndAudio = {
    word: word.word,
    translation: word.translation,
    similarWords: word.similarWords,
    created_at: word.createdAt,
    audioFiles: audioMap[word._id] || [],
  };

  res.json({success: true, details: wordAndAudio});
}

const selectRecordedWords = async (translation) => {
  const allPhrases = extractAllPhrases(translation);
  let searchFilter = { word: { $in: allPhrases } };
  const words = await DialectWord.find(searchFilter)
    .sort({createdAt: -1})
    .lean();

  const wordMap = words.map((word)=> ({
    _id: word._id,
    word: word.word
  }));

  let result = {};
  for(const word of wordMap){
    if(result[word.word]){
      result[word.word].push(word);
    } else {
      result[word.word] = [word];
    }
  }
  return result;
}


const extractAllPhrases = (translation) => {
  const words = translation.split(' ');
  const phrases = [];

  for (let start = 0; start < words.length; start++) {
    for (let end = start + 1; end <= words.length; end++) {
      const phrase = words.slice(start, end).join(' ');
      phrases.push(phrase);
    }
  }

  return phrases;
}

// ----- TRANSLATION HELPER FUNCTIONS

//Builds and adds prefix to the to be translated text
const createPrompt = (req) => {
  const inputLanguage = req.body.sourceLang;
  const outputLanguage = req.body.targetLang;

  const prefix = `translate ${inputLanguage} to ${outputLanguage}: `;

  return prefix + req.body.text;
}

//Tokenizes the text into the input the model expects
const tokenize = async (input, tokenizer) => {
  try {

    const result = await tokenizer(input);
    const tokenIds = result.input_ids.data;

    const int32TokenIds = new Array(tokenIds.length);
    for (let i = 0; i < tokenIds.length; i++) {
      int32TokenIds[i] = Number(tokenIds[i] % BigInt(2 ** 32)); // Handle overflow
    }
    return int32TokenIds;

  } catch (error) {
    console.error('Error during offline tokenization:', error);
  }
}

//Detokenizes the model output into text
const detokenize = async (input, tokenizer) => {
  try {
    const decoded = await tokenizer.decode(input, { skip_special_tokens: true });
    return decoded;
  } catch (error) {
    console.error('Error during offline tokenization:', error);
  }
}

//Pads or truncates tokens to fit model expectations
const createInputArray = (input, maxLength, padToken) => {

  let inputIds = input
  if (input.length < maxLength) {
    const paddingLength = maxLength - input.length
    inputIds = input.concat(Array(paddingLength).fill(padToken));
  } else if (input.length > maxLength) {
    inputIds = input.slice(0, maxLength);
  }
  return inputIds;
}

// Creates a mask for the input to indicate where the padding is
const createInputMask = (input, padToken) => {
  let inputMask = [];
  for (let i = 0; i < input.length; i++) {
    if (input[i] === padToken) {
      inputMask[i] = 0;
    } else {
      inputMask[i] = 1;
    }
  }

  return inputMask;
}

// Finds the greatest value in an array
const findMax = (arr) => {
  let max = -Infinity;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > max) {
      max = arr[i]
    }
  }

  return max;
}

// Finds the log sum exponent of an array 
const findLogSumExp = (arr, max) => {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += Math.exp(arr[i] - max);
  }

  return sum;
}

// Converts logits into the probability of a token being next in a sequence
const logSoftmax = (arr) => {
  const max = findMax(arr);
  const logSumExp = findLogSumExp(arr, max);

  for (let i = 0; i < arr.length; i++) {
    arr[i] = arr[i] - max - logSumExp;
  }
  return arr;
}

//Extracts the most probable token from the correct logits of the model output
const extractPredictedToken = (logits, vocabSize, decoderInputIdsLength) => {
  const lastTokenLogits = logits.slice((decoderInputIdsLength - 1) * vocabSize, decoderInputIdsLength * vocabSize);
  const logProbs = logSoftmax(lastTokenLogits);

  // Find the index of the maximum log probability token
  const predictedToken = logProbs.indexOf(findMax(logProbs));
  return predictedToken;
}