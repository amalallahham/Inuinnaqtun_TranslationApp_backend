const verifySession = (req, res, next) => {
  if (!req.session || !req.session.adminId) {
    return res.status(401).json({ error: "Access denied. No active session." });
  }

  try {
    req.adminId = req.session.adminId;
    req.adminRole = req.session.role;
    req.usermane = req.session.usermane;
    req.email = req.session.email;

    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid session" });
  }
};

export default verifySession;
