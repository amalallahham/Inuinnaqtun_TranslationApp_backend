import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../../models/users.js'; 
import nodemailer from 'nodemailer';
const CLIENT_URL = process.env.URL;

const JWT_SECRET = process.env.JWT_SECRET;

export const apiRegister = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists.' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      email,
      password: hashedPassword,
      username,
      role: 'DataEntry',
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
      { expiresIn: '7d' } 
    );

    return res.status(201).json({
      message: 'User registered successfully.',
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
    return res.status(500).json({ error: 'Server error. Please try again later.' });
  }
};


export const apiLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password)

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });

    if (!user || (user.role !== 'Admin' && user.role !== 'DataEntry')) {
      return res.status(401).json({ error: 'Invalid credentials or unauthorized role.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Login successful.',
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
    return res.status(500).json({ error: 'Server error. Please try again later.' });
  }
};

export const apiForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User doesn't exist." });
    }

    const token = jwt.sign({ email, type: 'email' }, JWT_SECRET, { expiresIn: '24h' });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetLink = `${CLIENT_URL}/admin/reset-password?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset Your Password',
      html: `
        <p>Hello,</p>
        <p>You have requested to reset your password. Click the link below to proceed:</p>
        <p><a href="${resetLink}" target="_blank">Reset Password</a></p>
        <p><strong>This link will expire in 24 hours.</strong></p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: 'Password reset email sent. Please check your inbox.', emailToken: token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to send email. Please try again later.' });
  }
};



export const apiResetPassword = async (req, res) => {
  const { password, confirmPassword, token } = req.body;

  if (!password || !confirmPassword || !token) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User doesn't exist." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: 'Invalid or expired token.' });
  }
};
