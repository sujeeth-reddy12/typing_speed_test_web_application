const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
  username: String,
  difficulty: String,
  wpm: Number,
  accuracy: Number,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Result", resultSchema);
