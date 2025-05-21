import Information from "../../models/information.js";

export const get_latest_information = async (req, res) => {
   try {
    const allInfo = await Information.find()
      .sort({ createdAt: -1 })
      .exec();

    res.status(200).json({
      success: true,
      data: allInfo,
    });
  } catch (err) {
    console.error("Error fetching all information:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};



export const add_information = async (req, res) => {
  try {
    const { title, content, status } = req.body;
    const createdBy = req?.user?._id;

    if (!title || !content || !status || !createdBy) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // If publishing, archive all previously published entries
    if (status === "published") {
      await Information.updateMany(
        { status: "published" },
        { $set: { status: "archived" } }
      );
    }

    const newInfo = await Information.create({
      title,
      content,
      status,
      createdBy,
    });

    return res.status(201).json({
      success: true,
      message: "Information created successfully",
      data: newInfo,
    });
  } catch (err) {
    console.error("Add Information Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const get_information_by_id = async (req, res) => {
  try {
    const info = await Information.findById(req.params.id)
      .populate("createdBy", "username")
      .lean();

    if (!info) {
      return res.status(404).json({
        success: false,
        error: "Information not found",
      });
    }

    res.json({
      success: true,
      data: info,
    });
  } catch (error) {
    console.error("Error fetching information by ID:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
};

export const updateInformation = async (req, res) => {
  try {
    const { title, content, status } = req.body;

    const info = await Information.findById(req.params.id);
    if (!info) {
      return res
        .status(404)
        .json({ success: false, message: "Information not found" });
    }

    info.title = title || info.title;
    info.content = content || info.content;
    info.status = status || info.status;

    const updatedInfo = await info.save();

    res.json({
      success: true,
      message: "Information updated successfully",
      data: updatedInfo,
    });
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteInformation = async (req, res) => {
  try {
    const info = await Information.findById(req.params.id);
    if (!info) {
      return res
        .status(404)
        .json({ success: false, message: "Information not found" });
    }

    await Information.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Information deleted successfully" });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
