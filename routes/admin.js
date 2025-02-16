import express from "express";
import { get_login, login, logout } from "../controllers/admin/login.js";
import { get_register, register } from "../controllers/admin/register.js";
import verifySession from "../middlewares/auth.js";
import { get_dashboard } from "../controllers/admin/dashboard.js";
import { redirectIfAuthenticated } from "../middlewares/is_logged.js";
const router = express.Router();

router.get("/login", redirectIfAuthenticated, get_login);
router.post("/login", redirectIfAuthenticated, login);

router.get("/register", redirectIfAuthenticated, get_register);
router.post("/register", redirectIfAuthenticated, register);

router.get("/logout", verifySession, logout);

router.get("/", verifySession, get_dashboard);

export default router;
