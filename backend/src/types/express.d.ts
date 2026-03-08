import { Request } from "express";
import { IUser } from "./models";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
