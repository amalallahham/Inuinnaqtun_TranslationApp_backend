import express from "express";
import { forgot_password, get_forgot_password, get_login, get_reset_password, login, logout, reset_password } from "../controllers/admin/login.js";
import { get_register, register } from "../controllers/admin/register.js";
import verifySession from "../middlewares/auth.js";
import { get_dashboard } from "../controllers/admin/dashboard.js";
import { redirectIfAuthenticated } from "../middlewares/is_logged.js";
import { verifyTokenMiddleware } from "../middlewares/verifyToken.js";
import is_admin from "../middlewares/is_admin.js";
import { delete_user, edit_user, get_edit_user, get_users, invite_user } from "../controllers/admin/users.js";
import { add_translation, delete_word, get_add_translation, get_translations, get_word_details, updateWord } from "../controllers/admin/translations.js";
import upload from "../middlewares/uploadMiddleware.js";
import { get_log_details, get_logs } from "../controllers/admin/logs.js";
import { add_information, get_add_information, get_information, get_information_by_id } from "../controllers/admin/information.js";
const router = express.Router();

router.get("/login", redirectIfAuthenticated, get_login);
router.post("/login", redirectIfAuthenticated, login);

router.get("/register", verifyTokenMiddleware, redirectIfAuthenticated, get_register);
router.post("/register",redirectIfAuthenticated, register);

router.get("/forgot-password", redirectIfAuthenticated, get_forgot_password);
router.post("/forgot-password", redirectIfAuthenticated, forgot_password);
router.get("/reset-password", verifyTokenMiddleware, redirectIfAuthenticated, get_reset_password);
router.post("/reset-password", verifyTokenMiddleware, redirectIfAuthenticated, reset_password);

router.get("/logout", verifySession, logout);

router.get("/users", is_admin, get_users);
router.post("/users/invite", is_admin, invite_user);

router.get("/users/edit/:id", is_admin, get_edit_user);
router.post("/users/edit/:id", is_admin, edit_user);

router.delete("/users/delete/:id", is_admin, delete_user);

router.get("/translations", verifySession, get_translations);

router.get("/translations/add-word", get_add_translation);
router.post("/translations/add-word", upload.single("audio"), add_translation);

router.get("/translations/:id", get_word_details);
router.delete("/translations/:id", delete_word);

router.post("/translations/update-word/:wordId", upload.single("audio"), updateWord);

router.get("/logs", is_admin, get_logs);
router.get("/logs/:id", is_admin, get_log_details);

router.get("/information", is_admin, get_information);
router.get("/information/add_info", is_admin, get_add_information);
router.get("/information/:id", is_admin, get_information_by_id);
router.post("/information/add_info", is_admin, add_information);






router.get("/", verifySession, get_dashboard);

export default router;
