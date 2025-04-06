import express from "express";
import { getUsers } from "../controllers/users.js";
import { get_translate, translate_text, getWordDetails } from "../controllers/translation/translate.js";

const router = express.Router();

router.get("/", getUsers);

router.get("/translate", get_translate);

router.get("/word-details/:id", getWordDetails);

router.post("/translate", translate_text);

export default router;
