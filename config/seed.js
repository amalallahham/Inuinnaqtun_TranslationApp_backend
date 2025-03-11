import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/users.js";
import DialectWord from "../models/dialectWords.js";
import AudioFile from "../models/audioFile.js";
import Flag from "../models/flag.js";
import Information from "../models/information.js";
import Log from "../models/log.js";
import connectDB from "../config/db.js";

async function seedDatabase() {
  try {
    await connectDB();
    console.log("Connected to MongoDB...");

    await User.deleteMany({});
    await DialectWord.deleteMany({});
    await AudioFile.deleteMany({});
    await Flag.deleteMany({});
    await Information.deleteMany({});
    await Log.deleteMany({});
    console.log("Database cleared...");

    const hashedPasswordAdmin = await bcrypt.hash("password123", 10);
    const hashedPasswordDataEntry = await bcrypt.hash("password123", 10);

    const users = await User.insertMany([
      { username: "admin", role: "Admin", email: "admin@example.com", password: hashedPasswordAdmin },
      { username: "data_entry1", role: "DataEntry", email: "data1@example.com", password: hashedPasswordDataEntry },
    ]);
    console.log("Users seeded...");

    const words = await DialectWord.insertMany([
      {
        word: "tamaffi",
        translation: "all of you",
        similarWords: [{ prefix: "tamaphi" }],
        versions: [
          {
            version: 1,
            changes: { oldWord: null, oldTranslation: null, newWord: "tamaffi", newTranslation: "all of you" },
            performedBy: users[0]._id,
          },
        ],
      },
      {
        word: "taktuktuq",
        translation: "foggy",
        similarWords: [{ prefix: "quunilaqijuq" }],
        versions: [
          {
            version: 1,
            changes: { oldWord: null, oldTranslation: null, newWord: "taktuktuq", newTranslation: "foggy" },
            performedBy: users[1]._id,
          },
        ],
      },
    ]);
    console.log("Dialect Words seeded...");

    const audioFiles = await AudioFile.insertMany([
      { filePath: "/file.mp3", wordId: words[0]._id },
      { filePath: "/file.mp3", wordId: words[1]._id },
    ]);
    console.log("Audio Files seeded...");

    const flags = await Flag.insertMany([
      { wordId: words[0]._id, flagReason: "Incorrect pronunciation", status: "pending" },
      { wordId: words[1]._id, audioFileId: audioFiles[1]._id, flagReason: "Low-quality audio", status: "pending" },
    ]);
    console.log("Flags seeded...");

    await Information.insertMany([
      { title: "Language Origins", content: "This dialect comes from ancient roots.", createdBy: users[0]._id },
      { title: "Grammar Rules", content: "Basic rules for conjugation and sentence structure.", createdBy: users[1]._id },
    ]);
    console.log("Information seeded...");

    await Log.insertMany([
      { action: "upload", wordId: words[0]._id, performedBy: users[0]._id },
      { action: "flag", flagId: flags[0]._id, performedBy: users[1]._id },
    ]);
    console.log("Logs seeded...");

    console.log("Database seeding complete.");
    mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding database:", error);
    mongoose.connection.close();
  }
}

seedDatabase();
