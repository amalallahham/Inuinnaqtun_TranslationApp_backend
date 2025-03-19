const is_admin = (req, res, next) => {
    if (!req.session || !req.session.adminId) {
      res.status(401).json({ error: "Access denied. No active session." });
      return res.redirect("/admin/login"); 
    }
    try {
        req.adminId = req.session.adminId;
        req.adminRole = req.session.role;
        req.username = req.session.username;
        req.email = req.session.email;
        req.user = req.session.user

      if (req.adminRole !== "Admin") {
        return res.redirect("/"); 
      }
  
      next();
    } catch (error) {
      res.status(401).json({ error: "Invalid session" });
    }
  };
  
  export default is_admin;
  