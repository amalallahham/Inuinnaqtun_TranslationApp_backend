import jwt from "jsonwebtoken";
import { getUserByEmail } from "../controllers/admin/users.js";

export const verifyAdminTokenMiddleware = async (req, res, next) => {
  try {
    let token =
      req.query.token || req.headers["authorization"] || req.body.token;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Access Denied. No token provided." });
    }

    if (token.startsWith("Bearer")) {
      token = token.replace("Bearer", "").trim();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.email) {
      return res.status(401).json({ message: "Invalid token format." });
    }

    const user = await getUserByEmail(decoded.email);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.role !== "Admin") {
      return res.status(403).json({ message: "User not authorized." });
    }

    req.user = user; 
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};
