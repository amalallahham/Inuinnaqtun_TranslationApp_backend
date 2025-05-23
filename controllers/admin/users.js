import User from "../../models/users.js";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import userRequests from "../../models/userRequests.js";

// export const get_users = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = 5;
//     const skip = (page - 1) * limit;

//     const users = await User.find({}).skip(skip).limit(limit);

//     const totalUsers = await User.countDocuments();
//     const totalPages = Math.ceil(totalUsers / limit);

//     res.render("users", {
//       title: "Users Management",
//       users,
//       error: null,
//       currentPage: page,
//       totalPages,
//       userEmail: req.session.email,
//     });
//   } catch (error) {
//     console.error(error);
//     res.render("users", {
//       title: "Users Management",
//       users: [],
//       error: "Failed to fetch users.",
//       currentPage: 1,
//       totalPages: 1,
//       userEmail: req.session.email,
//     });
//   }
// };

// Loads different list for different user types
export const get_users = async (req, res) => {
  try {
    // Get separate page queries
    const pageDataEntry = parseInt(req.query.pageDataEntry) || 1;
    const pageAdmin = parseInt(req.query.pageAdmin) || 1;
    const limit = 5;

    // Calculate skips
    const skipDataEntry = (pageDataEntry - 1) * limit;
    const skipAdmin = (pageAdmin - 1) * limit;

    // Get total counts
    const totalDataEntryUsers = await User.countDocuments({
      role: "DataEntry",
    });
    const totalAdminUsers = await User.countDocuments({ role: "Admin" });

    // Calculate total pages
    const totalPagesDataEntry = Math.ceil(totalDataEntryUsers / limit);
    const totalPagesAdmin = Math.ceil(totalAdminUsers / limit);

    // Fetch users with pagination
    const dataEntryUsers = await User.find({ role: "DataEntry" })
      .skip(skipDataEntry)
      .limit(limit);
    const adminUsers = await User.find({ role: "Admin" })
      .skip(skipAdmin)
      .limit(limit);

    res.render("users", {
      title: "Users Management",
      dataEntryUsers,
      adminUsers,
      error: null,
      currentPageDataEntry: pageDataEntry,
      currentPageAdmin: pageAdmin,
      totalPagesDataEntry,
      totalPagesAdmin,
      userEmail: req.session.email,
    });
  } catch (error) {
    console.error(error);
    res.render("users", {
      title: "Users Management",
      dataEntryUsers: [],
      adminUsers: [],
      error: "Failed to fetch users.",
      currentPageDataEntry: 1,
      currentPageAdmin: 1,
      totalPagesDataEntry: 1,
      totalPagesAdmin: 1,
      userEmail: req.session.email,
    });
  }
};

export const invite_user = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists." });
    }

    const token = jwt.sign(
      { email: req.session.email },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

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
      subject: "Invitation to Join",
      text: `Hello, you've been invited to join our platform. Click the link below to sign up. This link will expire in 24 hours.`,
      html: `
        <p>Hello,</p>
        <p>You've been invited to join our platform. Click the link below to sign up:</p>
        <p><strong>This link will expire in 24 hours.</strong></p>
        <p><a href="${process.env.URL}/admin/register?from=email&token=${token}" target="_blank">Join Now</a></p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: "Invitation sent successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error." });
  }
};

export const get_edit_user = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send("User not found");
    }
    res.render("edit_user", {
      user,
      error: null,
      success: null,
      title: "Edit User",
    });
  } catch (error) {
    res.status(500).send("Server error");
  }
};

export const edit_user = async (req, res) => {
  try {
    const { username, email, role, password } = req.body;
    let updatedUser = { username, email, role };

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updatedUser.password = hashedPassword;
    }

    await User.findByIdAndUpdate(req.params.id, updatedUser, { new: true });

    res.render("edit_user", {
      user: updatedUser,
      success: "User updated successfully!",
      error: null,
      title: "Edit User",
    });
  } catch (error) {
    res.render("edit_user", {
      user: req.body,
      error: "Error updating user.",
      success: null,
      title: "Edit User",
    });
  }
};

export const getUserByEmail = async (email) => {
  try {
    const user = await User.findOne({ email });

    return user;
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return null;
  }
};

export const delete_user = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found " });
    }

    await User.findByIdAndDelete(req.params.id);

    const existingRequest = await userRequests.findOne({ email: user.email });
    if (existingRequest) {
      await userRequests.findByIdAndDelete(existingRequest._id);
    }

    return res
      .status(200)
      .json({ message: "User and related request deleted successfully" });
  } catch (error) {
    console.error("Delete User Error:", error);
    return res
      .status(500)
      .json({ message: "Server error. Unable to delete user." });
  }
};
