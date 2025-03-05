import User from "../../models/users.js";
import bcrypt from "bcrypt";

export const get_login = async (req, res) => {
  res.render("login", { error: "", title: "login" });
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render("login", { error: "Email or Password are required", title: "login" });
    }

    const admin = await User.findOne({ email });

    if (!admin || (admin.role !== "Admin" && admin.role !== "DataEntry")) {
      return res.render("login", {
        error: "Invalid credentials or not an admin/editor",
        title: "login"
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.render("login", { error: "Password is incorrect",
        title: "login"
      });
    }

    req.session.adminId = admin._id;
    req.session.role = admin.role;
    req.session.username = admin.username;
    req.session.email = admin.email;
    req.session.user = admin

    return res.redirect("/admin/");
  } catch (error) {
    res.render("login", { error: "Server error, please try again later." });
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
