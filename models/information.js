import mongoose from 'mongoose';

const informationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  status: {
    type: String,
    enum: ["draft", "published", "archived"],
    default: "draft"
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true
  },
  createdAt: { type: Date, default: Date.now }
});

const Information = mongoose.model("Information", informationSchema);

informationSchema.index({ createdBy: 1 });

export default Information;