import Information from "../../models/information.js";

export const get_information = async (req, res) => {
  const infoList = await Information.find().populate("createdBy");

  res.render("information", {
    error: "",
    title: "Information",
    data: infoList,
  });
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

export const update_information = async (req, res) => {
  const { title, content, status } = req.body;
  await Information.findByIdAndUpdate(req.params.id, {
    title,
    content,
    status,
  });
};

export const remove = async (req, res) => {
  await Information.findByIdAndDelete(req.params.id);
  res.redirect("/information");
};
