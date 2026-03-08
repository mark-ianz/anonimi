import { Router } from "express";
import * as blockController from "../controllers/block.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { blockUserSchema, blockParamsSchema } from "../validators/block.validator";

const router = Router();

router.get("/", authenticate, blockController.getBlocks);
router.post("/", authenticate, validate(blockUserSchema), blockController.blockUser);
router.delete("/:blockId", authenticate, validate(blockParamsSchema), blockController.unblockUser);

export default router;
