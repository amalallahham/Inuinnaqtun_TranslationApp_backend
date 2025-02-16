import User from "../../models/users.js";
import bcrypt from "bcrypt";

export const get_register = async (req, res) => {
  res.render("register", { title: "Register" });
};

export const register = async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password || !username) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      email,
      password: hashedPassword,
      username,
      role: "DataEntry",
    });

    await newUser.save();

    req.session.adminId = newUser._id;
    req.session.role = newUser.role;
    req.session.username = newUser.username;
    req.session.email = newUser.email;

    res.render("index", { title: "Home Page", admin: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
