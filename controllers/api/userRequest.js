import bcrypt from 'bcrypt';
import userRequests from '../../models/userRequests.js';

export const submitUserRequest = async (req, res) => {
  try {
    const { email, username, password, reason } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const existingRequest = await userRequests.findOne({ email });

    if (existingRequest) {
      if (existingRequest.status === "approved") {
        return res.status(409).json({
          success: false,
          message: "This email has already been approved. Please log in.",
        });
      }

      if (existingRequest.status === "pending") {
        return res.status(409).json({
          success: false,
          message: "This email is already under review. Please wait for approval.",
        });
      }

      if (existingRequest.status === "rejected") {
        return res.status(403).json({
          success: false,
          message: "This request was rejected. Please contact the admin for more details.",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newRequest = await userRequests.create({
      email,
      username,
      password: hashedPassword,
      reason,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Your request was submitted successfully. We will send you an email once your account is approved.",
      data: {
        id: newRequest._id,
        email: newRequest.email,
        username: newRequest.username,
        status: newRequest.status,
      },
    });
  } catch (error) {
    console.error("Submit User Request Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};

