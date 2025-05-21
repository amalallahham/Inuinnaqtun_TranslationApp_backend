import Information from "../../models/information.js";

export const get_information = async (req, res) => {
  const infoList = await Information.find()
    .sort({ createdAt: -1 })
    .populate("createdBy", "username")
    .lean();

  res.render("information", {
    error: "",
    title: "Information",
    data: infoList,
  });
};

export const get_information_published = async (req, res) => {
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
      user: req?.session?.user
    });

  } catch (error) {
    console.error("Error fetching last published info:", error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
};


export const get_add_information = async (req, res) => {
  res.render("add_information", {
    error: "",
    title: "Information",
  });
};

export const add_information = async (req, res) => {
  try {
    const { title, content, status } = req.body;
    const createdBy = req.session?.user._id;

    if (status === "published") {
      await Information.updateMany(
        { status: "published" },
        { $set: { status: "archived" } }
      );
    }

    await Information.create({ title, content, status, createdBy });
    res.redirect("/admin/information");
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};

export const get_information_by_id = async (req, res) => {
  const info = await Information.findById(req.params.id).populate("createdBy");

  res.render("show_information", {
    error: "",
    title: "Information",
    info,
  });
};

export const get_edit_by_id = async (req, res) => {
  try {
    const info = await Information.findById(req.params.id);
    if (!info) {
      return res.status(404).send("Information not found");
    }

    res.render("edit_information", { info, title: "Edit Information" });
  } catch (err) {
    console.error("Render Edit Error:", err);
    res.status(500).send("Server error");
  }
};

export const updateInformation = async (req, res) => {
  try {
    const { title, content, status } = req.body;

    const info = await Information.findById(req.params.id);
    if (!info) {
      return res.status(404).send("Information not found");
    }

    info.title = title;
    info.content = content;
    info.status = status;

    await info.save();

    res.redirect("/admin/information");
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).send("Server error");
  }
};

export const deleteInformation = async (req, res) => {
  const infoId = req.params.id;

  try {
    const info = await Information.findById(infoId);
    if (!info) {
      return res
        .status(404)
        .json({ success: false, message: "Information not found" });
    }

    await Information.findByIdAndDelete(infoId);
    return res.json({
      success: true,
      message: "Information deleted successfully",
    });
  } catch (err) {
    console.error("Delete error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
