import DialectWord from "../../models/dialectWords.js";
import AudioFile from "../../models/audioFile.js";

import path from "path";
import fs from "fs";
import multer from "multer";
import mongoose from "mongoose";
import { createLog } from "./logs.js";

export const get_add_translation = async (req, res) => {
  try {
    res.render("add_translations", {
      title: "Translations",
    });
  } catch (error) {
    console.error("Error fetching translations:", error);
  }
};

export const add_translation = async (req, res) => {
  try {
    const { word, translation, linkedWords } = req.body;

    if (!word || !translation) {
      return res.status(400).json({
        success: false,
        message: "Word and translation are required.",
      });
    }

    const similarWords = linkedWords
      ? JSON.parse(linkedWords).map((w) => ({ prefix: w }))
      : [];

    const definitions = translation?.length > 0 ? translation.split(",") : [];

    const newWord = new DialectWord({
      word,
      translation: definitions,
      similarWords,
      versions: [],
      addedToModel: false,
    });

    await newWord.save();

    await createLog({
      action: "upload",
      performedBy: req.session?.user?._id,
      wordId: newWord._id,
      type: "translation",
    });

    let audioFileRecord = null;

    if (req.file) {
      const audioFilePath = `/uploads/${req.file.filename}`;

      audioFileRecord = new AudioFile({
        filePath: audioFilePath,
        wordId: newWord._id,
      });

      await audioFileRecord.save();
      await createLog({
        action: "upload",
        performedBy: req.session?.user?._id,
        wordId: newWord._id,
        audioFileId: audioFileRecord?._id,
        type: "audio",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Word added successfully!",
      word: newWord,
      audioFile: audioFileRecord,
    });
  } catch (error) {
    console.error("Error saving translation:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

export const get_translations = async (req, res) => {
  try {
    const query = req.query.query?.trim() || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const filter = req.query.filter || "all";
    const sortOrder = req.query.order === "desc" ? -1 : 1;

    let searchFilter = {};

    if (query) {
      searchFilter = {
        $or: [
          { word: { $regex: query, $options: "i" } },
          { translation: { $elemMatch: { $regex: query, $options: "i" } } },
        ],
      };
    }
    if (filter === "with_audio") {
      searchFilter["_id"] = { $in: await AudioFile.distinct("wordId") };
    } else if (filter === "without_audio") {
      searchFilter["_id"] = { $nin: await AudioFile.distinct("wordId") };
    }

    const words = await DialectWord.find(searchFilter)
      .select("word")
      .sort({ word: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const totalCount = await DialectWord.countDocuments(searchFilter);

    const wordIds = words.map((word) => word._id);
    const audioFiles = await AudioFile.find({
      wordId: { $in: wordIds },
    }).lean();

    const audioMap = {};
    audioFiles.forEach((audio) => {
      if (!audioMap[audio.wordId]) {
        audioMap[audio.wordId] = [];
      }
      audioMap[audio.wordId].push(audio.filePath);
    });

    const result = words.map((word) => ({
      word: word.word,
      id: word._id,
      audioFiles: audioMap[word._id] || [],
    }));

    res.render("translations", {
      title: "Translations",
      data: result,
      error: "",
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalItems: totalCount,
      filter,
      order: req.query.order || "asc",
      query,
    });
  } catch (error) {
    console.error("Error fetching translations:", error);
    res.render("translations", {
      title: "Translations",
      data: [],
      error: "Failed to fetch translations",
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      filter: "all",
      order: "asc",
    });
  }
};

export const get_word_details = async (req, res) => {
  try {
    const wordId = req.params.id;

    if (!wordId || !mongoose.Types.ObjectId.isValid(wordId)) {
      return res.status(400).render("word_definition", {
        error: "Invalid Word ID format",
        data: [],
        title: "Word definition",
      });
    }

    const objectId = new mongoose.Types.ObjectId(wordId);

    const word = await DialectWord.findById(objectId).lean();
    if (!word) {
      return res.status(404).render("word_definition", {
        error: "Word not found",
        data: [],
        title: "Word definition",
      });
    }

    const audioFiles = await AudioFile.find({ wordId: objectId }).lean();

    word.audioFiles = audioFiles.map((audio) => ({
      id: audio._id.toString(),
      filePath: `${audio.filePath}`,
      createdAt: audio.createdAt,
    }));

    return res.render("word_definition", {
      data: word,
      error: "",
      title: "Word definition",
    });
  } catch (error) {
    console.error("Error fetching word details:", error);
    return res.status(500).render("word_definition", {
      error: "Internal Server Error",
      data: [],
      title: "Word definition",
    });
  }
};

export const delete_word = async (req, res) => {
  const wordId = req.params.id;

  try {
    const deletedWord = await DialectWord.findByIdAndDelete(wordId);
    if (!deletedWord) {
      return res
        .status(404)
        .json({ success: false, message: "Word not found" });
    }

    const audioFiles = await AudioFile.find({ wordId });

    for (const audio of audioFiles) {
      const audioPath = path.join("public", audio.filePath);
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }

      await AudioFile.findByIdAndDelete(audio._id);

      await createLog({
        action: "delete",
        performedBy: req.session?.user?._id,
        wordId,
        audioFileId: audio._id,
        type: "audio",
      });
    }

    await createLog({
      action: "delete",
      performedBy: req.session?.user?._id,
      wordId,
      type: "translation",
    });

    res.json({
      success: true,
      message: "Word and associated audio files deleted.",
    });
  } catch (error) {
    console.error("Delete word error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateWord = async (req, res) => {
  try {
    const { wordId } = req.params;
    const { word, translation, linkedWords } = req.body;

    if (!wordId || !word || !translation) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const linkedWordsArray = linkedWords ? JSON.parse(linkedWords) : [];
    const definitions = translation?.length > 0 ? translation.split(",") : [];

    const existingWord = await DialectWord.findById(wordId);
    if (!existingWord) {
      return res
        .status(404)
        .json({ success: false, message: "Word not found" });
    }

    const existingAudio = await AudioFile.findOne({ wordId });

    if (req.file) {
      if (existingAudio) {
        const oldAudioPath = path.join("public", existingAudio.filePath);
        if (fs.existsSync(oldAudioPath)) {
          fs.unlinkSync(oldAudioPath); // Delete old file
        }
        await AudioFile.findByIdAndDelete(existingAudio._id); // Remove reference from DB
      }

      const newFilePath = `/uploads/${req.file.filename}`;
      const newAudio = new AudioFile({ filePath: newFilePath, wordId });
      await newAudio.save();
    }

    const updatedWord = await DialectWord.findByIdAndUpdate(
      wordId,
      {
        word,
        translation: definitions,
        similarWords: linkedWordsArray.map((prefix) => ({ prefix })),
      },
      { new: true, runValidators: true }
    );

    await createLog({
      action: "edit",
      performedBy: req.session?.user?._id,
      wordId: wordId,
      type: "translation",
    });

    res.status(200).json({
      success: true,
      updatedWord,
      message: "Word updated successfully",
    });
  } catch (error) {
    console.error("Error updating word:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
