import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import connectDB from "../config/db.js"; 
import User from "../models/users.js"; 

dotenv.config(); 

const seedAdmin = async () => {
  try {
    await connectDB(); 
    console.log("Connected to MongoDB...");

    const email = "admin@example.com";
    const existingAdmin = await User.findOne({ email });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("password123", 10);

      const adminUser = new User({
        username: "admin",
        email,
        password: hashedPassword,
        role: "Admin",
      });

      await adminUser.save();
      console.log("Admin user inserted successfully!");
    } else {
      console.log("Admin user already exists. Skipping insertion.");
    }

    mongoose.connection.close(); 
  } catch (error) {
    console.error("Error seeding database:", error);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedAdmin();
