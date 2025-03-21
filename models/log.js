import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ["upload", "flag", "edit", "delete"],
    required: true,
  },
  flagId: { type: mongoose.Schema.Types.ObjectId, ref: "Flag", default: null },
  wordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DialectWord",
    default: null,
  },
  audioFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AudioFile",
    default: null,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["translation", "audio"],
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

const Log = mongoose.model("Log", logSchema);


export default Log;