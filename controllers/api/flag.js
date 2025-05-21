import AudioFile from "../../models/audioFile.js";
import DialectWord from "../../models/dialectWords.js";
import Flag from "../../models/flag.js";

export const getWordForFlag = async (req, res) => {
  try {
    const word = await DialectWord.findById(req.params.id).lean();

    if (!word) {
      return res.status(404).json({ success: false, message: "Word not found." });
    }

    res.json({ success: true, data: word });
  } catch (error) {
    console.error("Error fetching word:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const submitFlag = async (req, res) => {
  try {
    const { flagReason, description } = req.body;
    const wordId = req.params.id;
    const performedBy = req.session?.user?._id || null;

    const audio = {};
    if (flagReason.toLowerCase() === "audio") {
      const audioFiles = await AudioFile.find({ wordId }).lean();
      audio.audioFileId = audioFiles.at(-1)?._id?.toString() || null;
    }

    const flag = await Flag.create({
      wordId,
      flagReason: `${flagReason}: ${description}`,
      status: "pending",
      ...audio,
    });

    await createLog({
      action: "flag",
      performedBy,
      type: flagReason.toLowerCase(),
      flagId: flag._id,
      wordId,
      ...audio,
    });

    res.status(201).json({ success: true, data: flag });
  } catch (error) {
    console.error("Error in submitFlag:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAllFlags = async (req, res) => {
  try {
    const { status, order = "desc" } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const sortOrder = order === "asc" ? 1 : -1;

    const flags = await Flag.find(filter)
      .populate("wordId")
      .sort({ createdAt: sortOrder }) // only allow sorting by createdAt
      .lean();

    res.json({ success: true, data: flags });
  } catch (error) {
    console.error("Error fetching all flags:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const getFlagDetail = async (req, res) => {
  try {
    const flag = await Flag.findById(req.params.id)
      .populate("wordId audioFileId")
      .lean();

    if (!flag) {
      return res.status(404).json({ success: false, message: "Flag not found." });
    }

    res.json({ success: true, data: flag });
  } catch (error) {
    console.error("Error fetching flag detail:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const resolveFlag = async (req, res) => {
  try {
    const updatedFlag = await Flag.findByIdAndUpdate(
      req.params.id,
      {
        status: "resolved",
        resolvedBy: req.user._id,
      },
      { new: true }
    );

    if (!updatedFlag) {
      return res.status(404).json({ success: false, message: "Flag not found." });
    }

    res.json({ success: true, message: "Flag resolved", data: updatedFlag });
  } catch (error) {
    console.error("Error resolving flag:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
