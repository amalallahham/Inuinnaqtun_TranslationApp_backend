
import mongoose from 'mongoose';

const flagSchema = new mongoose.Schema({
  wordId: { type: mongoose.Schema.Types.ObjectId, ref: 'DialectWord', required: true },
  audioFileId: { type: mongoose.Schema.Types.ObjectId, ref: 'AudioFile', default: null },
  flagReason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'resolved'], default: 'pending' },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now }
});

const Flag = mongoose.model('Flag', flagSchema);


export default Flag;
