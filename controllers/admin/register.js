import User from "../../models/users.js";
import bcrypt from "bcrypt";

export const get_register = (req, res) => {
  res.render("register", { title: "Register", error: null });
};

export const register = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.render("register", { title: "Register", error: "All fields are required." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render("register", { title: "Register", error: "User already exists." });
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
    req.session.user = newUser


    return res.redirect("/admin/"); 
  } catch (error) {
    console.error(error);
    res.render("register", { title: "Register", error: "Server error, please try again later." });
  }
};
