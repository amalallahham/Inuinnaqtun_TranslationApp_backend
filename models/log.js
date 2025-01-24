const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  action: { type: String, required: true }, 
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, 
});

module.exports = mongoose.model("Log", logSchema);
