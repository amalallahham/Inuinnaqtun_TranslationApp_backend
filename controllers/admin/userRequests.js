import userRequests from "../../models/userRequests.js";
import nodemailer from "nodemailer";
import User from "../../models/users.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const approveUserRequest = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const request = await userRequests.findOne({ email });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "User request not found.",
      });
    }

    // Mark request as approved
    request.status = "approved";
    await request.save();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      await User.create({
        email: request.email,
        username: request.username,
        password: request.password,
        role: "DataEntry",
      });
    }

    // Send email
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: "Your Account Has Been Approved",
      html: `
        <h2>Your Account Has Been Approved</h2>
        <p>We're happy to inform you that your request to join the team has been approved.</p>
        <p>You can now access the platform using your account credentials.</p>
        <br/>
        <p>Thank you,<br/>Administration Team</p>
      `,
    });

    return res.status(200).json({
      success: true,
      message: `User ${email} approved successfully. An email has been sent.`,
    });
  } catch (error) {
    console.error("Approve Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while approving the user.",
    });
  }
};


export const deleteUserRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await userRequests.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "User request not found.",
      });
    }

    await userRequests.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `User request from ${request.email} was declined and deleted.`,
    });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while declining the user.",
    });
  }
};


export const get_user_request = async (req, res) => {
  try {
    const dataEntryUsers = await userRequests.find({ status: "pending" });
    res.render("userRequests", {
      title: "User Requests",
      dataEntryUsers,
      message: null,
      error: null,
    });
  } catch (error) {
    console.error("Error loading user requests:", error);
    res.render("userRequests", {
      title: "User Requests",
      dataEntryUsers: [],
      message: null,
      error: "Failed to load user requests.",
    });
  }
};
