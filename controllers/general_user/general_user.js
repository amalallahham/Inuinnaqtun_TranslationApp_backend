import Information from "../../models/information.js";
import bcrypt from "bcrypt";
import userRequests from "../../models/userRequests.js";

export const get_information = async (req, res) => {
  try {
    const lastPublished = await Information.findOne({ status: "published" })
      .sort({ createdAt: -1 })
      .exec();

    if (!lastPublished) {
      return res.render("general_information", {
        info: {
          title: "No published information found.",
        },
      });
    }

    res.render("general_information", {
      info: lastPublished,
      title: "information",
    });
  } catch (error) {
    console.error("Error fetching last published info:", error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
};

export const get_requestAccess = async (req, res) => {
  return res.render("requestAccess", {
    error: "",
    title: "Request Access",
    message: "",
    formData: {},
  });
};

export const submitUserRequest = async (req, res) => {
  try {
    const { email, username, password, reason } = req.body;
    if (!email || !username || !password) {
      return res.render("requestAccess", {
        error: "All fields are required.",
        formData: { email, username, reason },
        message: "",
        title: "Request Access",
      });
    }

    const existingRequest = await userRequests.findOne({ email });

    if (existingRequest) {
      if (existingRequest.status === "approved") {
        return res.render("requestAccess", {
          error: "This email has already been approved. Please log in.",
          formData: { email, username, reason },
          message: "",
          title: "Request Access",
        });
      }

      if (existingRequest.status === "pending") {
        return res.render("requestAccess", {
          error:
            "This email is already under review. Please wait for approval.",
          formData: { email, username, reason },
          message: "",
          title: "Request Access",
        });
      }

      if (existingRequest.status === "rejected") {
        return res.render("requestAccess", {
          error:
            "This request was rejected. Please contact the admin for more details.",
          formData: { email, username, reason },
          message: "",
          title: "Request Access",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newRequest = await userRequests.create({
      email,
      username,
      password: hashedPassword,
      reason,
      status: "pending", // optional if already default in schema
    });

    return res.render("requestAccess", {
      message:
        "Your request was submitted successfully. We will send you an email once your account is approved.",
      error: "",
      title: "Request Access",
      formData: {},
    });
  } catch (error) {
    console.error("Submit User Request Error:", error);
    res.render("requestAccess", {
      error: "Something went wrong. Please try again later.",
      formData: req.body,
      message: "",
      title: "Request Access",
    });
  }
};
