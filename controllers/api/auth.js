import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../../models/users.js";
import nodemailer from "nodemailer";
const CLIENT_URL = process.env.URL;

const JWT_SECRET = process.env.JWT_SECRET;

export const apiRegister = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists." });
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

    const token = jwt.sign(
      {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      message: "User registered successfully.",
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Server error. Please try again later." });
  }
};

export const apiLogin = async (req, res) => {
  try {
    const email = req.body?.email;
    const password = req.body?.password;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email });

    if (!user || (user.role !== "Admin" && user.role !== "DataEntry")) {
      return res
        .status(401)
        .json({ error: "Invalid credentials or unauthorized role." });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect password." });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Server error. Please try again later." });
  }
};

// Forgot Password - Send Reset Link
export const apiForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email?.email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const user = await User.findOne({ email: email?.email });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Generate a token that expires in 24 hours
    const token = jwt.sign({ email, type: "reset" }, JWT_SECRET, {
      expiresIn: "24h",
    });

    // Create reset password link (deep link format)
    const resetLink = `${process.env.REDIRECT_URL}?action=reset&token=${token}`;

    // Setup nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email?.email,
      subject: "Reset Your Password",
      html: `
        <p>Hello,</p>
        <p>You requested to reset your password. Click the link below to proceed:</p>
        <a href="${resetLink}" target="_blank">Reset Password</a>
        <p><strong>This link will expire in 24 hours.</strong></p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      message: "Password reset link sent. Check your email.",
      emailToken: token,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Error sending reset link. Please try again." });
  }
};

// Reset Password - Update the Password
export const apiResetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ error: "Token and new password are required." });
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || decoded.type !== "reset") {
      return res.status(400).json({ error: "Invalid or expired token." });
    }

    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    const new_token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Password has been reset successfully.",
      new_token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Error resetting password. Please try again." });
  }
};
