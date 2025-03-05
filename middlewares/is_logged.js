export const redirectIfAuthenticated = (req, res, next) => {
    if (req.session.email) {
      return res.redirect("/admin/"); 
    }
    next(); 
  };
  