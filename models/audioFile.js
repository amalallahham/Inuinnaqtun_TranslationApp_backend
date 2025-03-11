import mongoose from 'mongoose';

const audioFileSchema = new mongoose.Schema({
  filePath: { type: String, required: true },
  wordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DialectWord",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

const AudioFile = mongoose.model("AudioFile", audioFileSchema);

export default AudioFile;
