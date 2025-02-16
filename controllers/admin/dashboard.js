import User  from "../../models/users.js";

export const get_dashboard = async (req, res) => {
  res.render("index", { title: "Dashboard", user: req.session });
};

