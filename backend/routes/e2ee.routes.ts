import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { registerE2EEKey, getE2EEKey, getMyE2EEKey } from "../controllers/e2ee.controller";

const router = Router();

router.use(authenticate);

router.post("/keys/register", registerE2EEKey);
router.get("/keys/me", getMyE2EEKey);
router.get("/keys/:userId", getE2EEKey);

export default router;
