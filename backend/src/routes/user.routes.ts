import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { searchUsersSchema, userParamsSchema } from "../validators/user.validator";

const router = Router();

router.get("/search", authenticate, validate(searchUsersSchema), userController.searchUsers);
router.get("/:anonimiId", authenticate, validate(userParamsSchema), userController.getUserByAnonimiId);

export default router;
