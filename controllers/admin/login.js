import User from "../../models/users.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

export const get_login = async (req, res) => {
  res.render("login", { error: "", title: "login" });
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render("login", {
        error: "Email or Password are required",
        title: "login",
      });
    }

    const admin = await User.findOne({ email });

    if (!admin || (admin.role !== "Admin" && admin.role !== "DataEntry")) {
      return res.render("login", {
        error: "Invalid credentials or not an admin/editor",
        title: "login",
      });
    }


    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.render("login", {
        error: "Password is incorrect",
        title: "login",
      });
    }

    req.session.adminId = admin._id;
    req.session.role = admin.role;
    req.session.username = admin.username;
    req.session.email = admin.email;
    req.session.user = admin;

    return res.redirect("/admin/");
  } catch (error) {
    res.render("login", { error: "Server error, please try again later.", title: 'Login' });
  }
};

export const logout = async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    
    }
    return res.redirect("/");
  });
};

export const get_forgot_password = async (req, res) => {
  res.render("forgot_password", {
    error: "",
    title: "Forgot password",
    success: "",
  });
};

export const forgot_password = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      // return res.status(400).json({ message: "Email is required." });
      res.render("forgot_password", {
        error: "Email is required",
        title: "Forgot password",
        success: "",
      });
    }

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      // return res.status(400).json({ message: "User doesn't exist" });
      res.render("forgot_password", {
        error: "User doesn't exist",
        title: "Forgot password",
        success: "",
      });
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset Your Password",
      text: `Hello, 
          
    You have requested to reset your password. Click the link below to reset it. This link will expire in 24 hours.
    
    ${process.env.URL}/admin/reset-password?token=${token}
    
    If you did not request this, please ignore this email.`,

      html: `
        <p>Hello,</p>
        <p>You have requested to reset your password. Click the link below to proceed:</p>
        <p><a href="${process.env.URL}/admin/reset-password?token=${token}" target="_blank">Reset Password</a></p>
        <p><strong>This link will expire in 24 hours.</strong></p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.render("forgot_password", {
      success: "An email has been sent with password reset instructions. Please check your inbox.",
      title: "Forgot password",
      error: "",
    });
  } catch (error) {
    console.error(error);
    res.render("forgot_password", {
      error: "There was an error sending the email. Please try again later.",
      title: "Forgot password",
      success: "",
    });
  }
};

export const get_reset_password = async (req, res) => {
  const token = req.query.token || req.headers["authorization"];
  res.render("reset_password", {
    error: "",
    title: "Reset password",
    success: "",
    token,
  });
};

export const updateUserPassword = async (email, newPassword) => {
  try {
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { password: newPassword }, 
      { new: true }
    );

    return updatedUser;
  } catch (error) {
    console.error("Error updating user password:", error);
    return null;
  }
};


export const reset_password = async (req, res) => {
  const { password, confirmPassword, token } = req.body;
  if (password !== confirmPassword) {
    return res.render("reset_password", {
      error: "Passwords do not match.",
      title: "Reset Password",
      token,
      success: "",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    
    if (!email) {
      return res.render("reset_password", {
        error: "User doesn't exist",
        token,
        success: "",
        title: "Reset Password",
      });
    }

    // Hash the new password once
    const hashedPassword = await bcrypt.hash(password, 10);

    // Pass the hashed password to updateUserPassword (without hashing it again)
    await updateUserPassword(email, hashedPassword);

    res.render("reset_password", {
      success: "Your password has been reset successfully. You can now log in.",
      error: "",
      token,
      title: "Reset Password",
    });
  } catch (error) {
    console.error(error);
    res.render("reset_password", {
      error: "Something went wrong. Please try again later.",
      title: "Reset Password",
      token,
      success: "",
    });
  }
};
