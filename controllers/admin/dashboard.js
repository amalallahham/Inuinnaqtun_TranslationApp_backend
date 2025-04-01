import User  from "../../models/users.js";

export const get_dashboard = async (req, res) => {
  // res.render("index", { title: "Dashboard", user: req.session });
  if (!req.session || !req.session.adminId) {
    res.render("translate", { error: "", title: "Translate", isAdmin: false });
  }
  res.render("translate", { error: "", title: "Translate", isAdmin: true });
};

