import express from "express";
import {
  get_translate,
  translate_text,
  getWordDetails,
  getRecordedWords,
} from "../controllers/translation/translate.js";
import { submitFlag } from "../controllers/flag/flag.js";
import {
  apiForgotPassword,
  apiLogin,
  apiRegister,
  apiResetPassword,
} from "../controllers/api/auth.js";
import { get_information } from "../controllers/api/information.js";
import { delete_user, get_users, invite_user } from "../controllers/api/users.js";
import { verifyTokenMiddleware } from "../middlewares/verifyToken.js";
import { verifyAdminTokenMiddleware } from "../middlewares/verifyAdminToken.js";

const router = express.Router();

router.get("/word-details/:id", getWordDetails);

router.get("/recorded-words/:text", getRecordedWords);

router.post("/translate", translate_text);

router.post("/flag/:id", submitFlag);
router.post("/register", apiRegister);
router.post("/login", apiLogin);
router.post("/forgot-password", apiForgotPassword);
router.post("/reset-password", apiResetPassword);
router.get("/information", get_information);

router.get("/users", verifyAdminTokenMiddleware, get_users);
router.post("/users/invite", verifyAdminTokenMiddleware, invite_user);
router.delete("/users/delete/:id", verifyAdminTokenMiddleware, delete_user);



export default router;
