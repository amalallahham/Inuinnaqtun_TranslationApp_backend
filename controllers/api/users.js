import User from "../../models/users.js";

export const get_users = async (req, res) => {
  try {
    const pageDataEntry = parseInt(req.query.pageDataEntry) || 1;
    const pageAdmin = parseInt(req.query.pageAdmin) || 1;
    const limit = 5;

    const skipDataEntry = (pageDataEntry - 1) * limit;
    const skipAdmin = (pageAdmin - 1) * limit;

    const [totalDataEntryUsers, totalAdminUsers] = await Promise.all([
      User.countDocuments({ role: "DataEntry" }),
      User.countDocuments({ role: "Admin" }),
    ]);

    const totalPagesDataEntry = Math.ceil(totalDataEntryUsers / limit);
    const totalPagesAdmin = Math.ceil(totalAdminUsers / limit);

    const [dataEntryUsers, adminUsers] = await Promise.all([
      User.find({ role: "DataEntry" }).skip(skipDataEntry).limit(limit),
      User.find({ role: "Admin" }).skip(skipAdmin).limit(limit),
    ]);

    res.json({
      success: true,
      data: {
        dataEntryUsers,
        adminUsers,
        currentPageDataEntry: pageDataEntry,
        currentPageAdmin: pageAdmin,
        totalPagesDataEntry,
        totalPagesAdmin,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users.",
      error: error.message,
    });
  }
};

export const invite_user = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists." });
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    const redirectUrl = `${process.env.REDIRECT_URL}?action=invite&token=${token}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "You're Invited to Join!",
      html: `
        <p>Hello,</p>
        <p>You've been invited to join our platform. Click the link below to sign up:</p>
        <p><strong>This link will expire in 24 hours.</strong></p>
        <p><a href="${redirectUrl}" target="_blank" style="padding:10px 20px; background:#007bff; color:#fff; border-radius:5px; text-decoration:none;">Join Now</a></p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: "Invitation sent successfully.",
    });


  } catch (error) {
    console.error("Invite API error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send invite.",
      error: error.message,
    });
  }
};

export const delete_user = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully.",
    });

  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Unable to delete user.",
      error: error.message,
    });
  }
};
