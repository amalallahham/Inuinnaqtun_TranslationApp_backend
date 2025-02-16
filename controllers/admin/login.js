import User from "../../models/users.js";
import bcrypt from "bcrypt";

export const get_login = async (req, res) => {
  res.render("login", { title: "login" });
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const admin = await User.findOne({ email });

    if (!admin || (admin.role !== "Admin" && admin.role !== "DataEntry")) {
      return res
        .status(401)
        .json({ message: "Invalid credentials or not an admin/editor" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    req.session.adminId = admin._id;
    req.session.role = admin.role;
    req.session.username = admin.username;
    req.session.email = admin.email;

    return res.redirect("/admin/");
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.redirect("/admin/");
    }
    res.clearCookie("connect.sid");
    res.redirect("/admin/login");
  });
};
