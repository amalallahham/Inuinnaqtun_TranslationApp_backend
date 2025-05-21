import express from "express";
import { get_information, get_requestAccess, submitUserRequest } from "../controllers/general_user/general_user.js"
import { get_translate } from "../controllers/translation/translate.js";
import { submitFlag } from "../controllers/flag/flag.js";

const router = express.Router();

router.get("/", get_translate);

router.get('/information', get_information)

router.get("/translate", get_translate);



router.post('/flag/:id', submitFlag);

router.get('/requestAccess', get_requestAccess)

router.post('/requestAccess', submitUserRequest)


export default router;
