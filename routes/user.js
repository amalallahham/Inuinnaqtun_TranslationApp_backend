import express from "express";
import { get_information } from "../controllers/general_user/general_user.js"
import { get_translate, translate_text, getWordDetails } from "../controllers/translation/translate.js";

const router = express.Router();

// router.get("/", getUsers);

router.get('/information', get_information)

router.get("/translate", get_translate);

router.get("/word-details/:id", getWordDetails);

router.post("/translate", translate_text);

export default router;
