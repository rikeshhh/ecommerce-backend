const mongoose = require("mongoose");

const giveawayEntrySchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  enteredAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("GiveawayEntry", giveawayEntrySchema);
