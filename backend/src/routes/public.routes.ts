import { Router, Request, Response, NextFunction } from "express";
import * as contactMessageService from "../services/contactMessage.service";
import { apiSuccess } from "../utils/apiResponse";
import { ValidationError } from "../utils/apiError";

const router = Router();

router.post(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, subject, message, phone_number } = req.body;

      if (phone_number && phone_number.toString().trim().length > 0) {
        return apiSuccess(res, { message: "Message sent successfully" }, 201);
      }

      if (!name || !email || !subject || !message) {
        throw new ValidationError("All fields are required");
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new ValidationError("Invalid email format");
      }

      if (name.trim().length < 1 || name.trim().length > 100) {
        throw new ValidationError("Name must be between 1 and 100 characters");
      }

      if (subject.trim().length < 1 || subject.trim().length > 200) {
        throw new ValidationError("Subject must be between 1 and 200 characters");
      }

      if (message.trim().length < 1 || message.trim().length > 5000) {
        throw new ValidationError("Message must be between 1 and 5000 characters");
      }

      const result = await contactMessageService.createContactMessage({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });

      return apiSuccess(res, { message: "Message sent successfully" }, 201);
    } catch (error) {
      next(error);
    }
  }
);

export default router;