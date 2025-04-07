import Flag from "../../models/flag.js";
import DialectWord from "../../models/dialectWords.js";
import AudioFile from "../../models/audioFile.js";
import { createLog } from "../admin/logs.js";

// Show Flag Report Form
export const renderFlagForm = async (req, res) => {
  try {
    const word = await DialectWord.findById(req.params.id).lean();

    if (!word) {
      return res.status(404).render("error", { message: "Word not found." });
    }

    res.render("flags", {
      word,
      isAdmin: req.session?.user,
      title: "Flags Report",
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
};
export const submitFlag = async (req, res) => {
  try {
    const { flagReason, description } = req.body;

    const audio = {};
    if (flagReason.toLowerCase() === "audio") {
      const audioFiles = await AudioFile.find({ wordId: req.params.id }).lean();

      audio.audioFileId =
        audioFiles.length > 0
          ? audioFiles[audioFiles.length - 1]._id.toString()
          : null;
    }

    const flag = await Flag.create({
      wordId: req.params.id,
      flagReason: `${flagReason}: ${description}`,
      status: "pending",
      ...audio,
    });

    await createLog({
      action: "flag",
      performedBy: req.session?.user?._id || null,
      type: flagReason.toLowerCase(),
      flagId: flag._id,
      wordId: req.params.id,
      ...audio,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in submitFlag:", error);
    return res.status(500).send(error.message);
  }
};

export const getAllFlags = async (req, res) => {
  try {
    const flags = await Flag.find()
      .populate("wordId")
      .sort({ createdAt: -1 })
      .lean();
    res.render("allFlags", {
      flags,
      isAdmin: req.session?.user,
      title: "Flags",
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

export const getFlagDetail = async (req, res) => {
  try {
    const flag = await Flag.findById(req.params.id)
      .populate("wordId audioFileId")
      .lean();

    if (!flag) {
      return res.status(404).render("error", { message: "Flag not found." });
    }

    res.render("flagDetail", {
      flag,
      isAdmin: req.session?.user,
      title: "Flags",
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// Resolve a flag (Admin)
export const resolveFlag = async (req, res) => {
  try {
    await Flag.findByIdAndUpdate(req.params.id, {
      status: "resolved",
      resolvedBy: req.user._id,
    });

    res.redirect("/admin/flags");
  } catch (error) {
    res.status(500).send(error.message);
  }
};
