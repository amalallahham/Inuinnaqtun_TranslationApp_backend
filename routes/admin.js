import express from "express";
import { get_login, login, logout } from "../controllers/admin/login.js";
import { get_register, register } from "../controllers/admin/register.js";
import verifySession from "../middlewares/auth.js";
import { get_dashboard } from "../controllers/admin/dashboard.js";
import { redirectIfAuthenticated } from "../middlewares/is_logged.js";
import { verifyTokenMiddleware } from "../middlewares/authorization.js";
import is_admin from "../middlewares/is_admin.js";
import { delete_user, edit_user, get_edit_user, get_users, invite_user } from "../controllers/admin/users.js";
const router = express.Router();

router.get("/login", redirectIfAuthenticated, get_login);
router.post("/login", redirectIfAuthenticated, login);

router.get("/register", verifyTokenMiddleware, redirectIfAuthenticated, get_register);
router.post("/register",redirectIfAuthenticated, register);

router.get("/logout", verifySession, logout);

router.get("/users", is_admin, get_users);
router.post("/users/invite", is_admin, invite_user);

router.get("/users/edit/:id", is_admin, get_edit_user);
router.post("/users/edit/:id", is_admin, edit_user);

router.delete("/users/delete/:id", is_admin, delete_user);



router.get("/", verifySession, get_dashboard);

export default router;
