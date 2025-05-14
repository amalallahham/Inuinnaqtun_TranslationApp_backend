import mongoose from 'mongoose';

const dialectWordSchema = new mongoose.Schema({
  word: { type: String, required: true },
  
  // Changed: translation is now an array of strings
  translation: [{ type: String, required: true }],

  addedToModel: { type: Boolean, default: false },

  // Changed: similarWords now has both a prefix and a reference to another word
  similarWords: [
    {
      prefix: { type: String, required: true },
      wordRef: { type: mongoose.Schema.Types.ObjectId, ref: "DialectWord" },
    },
  ],

  versions: [
    {
      version: { type: Number, required: true },
      date: { type: Date, default: Date.now },
      changes: {
        oldWord: { type: String, default: null },
        oldTranslation: [{ type: String, default: null }],
        newWord: { type: String, default: null },
        newTranslation: [{ type: String, default: null }],
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
