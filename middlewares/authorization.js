import jwt from "jsonwebtoken";

export const verifyTokenMiddleware = (req, res, next) => {
  try {
    const token = req.query.token || req.headers["authorization"] 

    if (!token) {
      return res.status(401).json({ message: "Access Denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = decoded;
    
    next();

  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};
