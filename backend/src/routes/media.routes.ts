import { Router } from "express";
import * as mediaController from "../controllers/media.controller";
import { authenticate } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";

const router = Router();

router.post("/upload", authenticate, upload.single("file"), mediaController.uploadMedia);

export default router;
