import mongoose from 'mongoose';

const dialectWordSchema = new mongoose.Schema({
  word: { type: String, required: true },
  translation: { type: String, required: true },
  similarWords: [
    {
      prefix: { type: String, required: true },
    },
  ],
  versions: [
    {
      version: { type: Number, required: true },
      date: { type: Date, default: Date.now },
      changes: {
        oldWord: { type: String, default: null },
        oldTranslation: { type: String, default: null },
        newWord: { type: String, default: null },
        newTranslation: { type: String, default: null },
      },
      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});


const DialectWord = mongoose.model("DialectWord", dialectWordSchema);

export default DialectWord;
