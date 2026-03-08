import { Router } from "express";
import * as reportController from "../controllers/report.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { createReportSchema } from "../validators/report.validator";

const router = Router();

router.post("/", authenticate, validate(createReportSchema), reportController.createReport);

export default router;
