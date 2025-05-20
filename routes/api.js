import express from "express";

import { submitFlag } from "../controllers/flag/flag.js";
import {
  apiForgotPassword,
  apiLogin,
  apiRegister,
  apiResetPassword,
} from "../controllers/api/auth.js";
import { add_information, deleteInformation, get_information, get_information_by_id, updateInformation } from "../controllers/api/information.js";
import { delete_user, edit_user, get_user, get_users, invite_user } from "../controllers/api/users.js";
import { verifyTokenMiddleware } from "../middlewares/verifyToken.js";
import { verifyAdminTokenMiddleware } from "../middlewares/verifyAdminToken.js";
import { add_translation, delete_word, get_translations, get_word_details, updateWord } from "../controllers/api/database.js";
import upload from "../middlewares/uploadMiddleware.js";
import { get_log_details, get_logs } from "../controllers/api/logs.js";
import { get_add_information } from "../controllers/admin/information.js";
import { getAllFlags, getFlagDetail, getWordForFlag, resolveFlag } from "../controllers/api/flag.js";

const router = express.Router();


router.post("/register", apiRegister);
router.post("/login", apiLogin);
router.post("/forgot-password", apiForgotPassword);
router.post("/reset-password", apiResetPassword);
router.get("/information", get_information);

router.get("/users", verifyAdminTokenMiddleware, get_users);
router.post("/users/invite", verifyAdminTokenMiddleware, invite_user);
router.delete("/users/delete/:id", verifyAdminTokenMiddleware, delete_user);
router.get("/users/:id", verifyAdminTokenMiddleware, get_user);
router.post("/users/edit/:id", verifyAdminTokenMiddleware, edit_user);

router.get("/database", verifyAdminTokenMiddleware, get_translations);
router.post("/database/add_word", verifyAdminTokenMiddleware, upload.single("audio"), add_translation);
router.get("/database/:id", verifyAdminTokenMiddleware, get_word_details);
router.delete("/database/:id", verifyAdminTokenMiddleware, delete_word);
router.post("/database/update-word/:wordId", verifyAdminTokenMiddleware,upload.single("audio"), updateWord);

router.get("/logs", verifyAdminTokenMiddleware, get_logs);
router.get("/logs/:id", verifyAdminTokenMiddleware, get_log_details);

router.get("/information/:id", verifyAdminTokenMiddleware, get_information_by_id);
router.post("/information/edit/:id", verifyAdminTokenMiddleware, updateInformation);
router.post("/information/add_info", verifyAdminTokenMiddleware, add_information);
router.delete('/information/delete/:id', verifyAdminTokenMiddleware, deleteInformation);


router.post("/flag/:id", submitFlag);

router.get("/flags", verifyAdminTokenMiddleware, getAllFlags);              
router.get("/flags/:id", verifyAdminTokenMiddleware, getFlagDetail);        
router.patch("/flags/:id/resolve", verifyAdminTokenMiddleware, resolveFlag); 

export default router;
