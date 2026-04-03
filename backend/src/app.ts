import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import routes from "./routes/index";
import { errorHandler } from "./middleware/errorHandler.middleware";
import { env } from "./config/env";

export const createApp = (): Express => {
  const app = express();

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(cors({
    origin: process.env.CORS_ORIGIN || "https://anonimi-messaging.vercel.app",
    credentials: true,
  }));

  app.use(
    "/uploads",
    express.static(path.resolve(env.UPLOAD_DIR), {
      setHeaders: (res, filePath) => {
        res.setHeader("X-Content-Type-Options", "nosniff");

        const extension = path.extname(filePath).toLowerCase();
        if (extension === ".png" || extension === ".jpg" || extension === ".jpeg" || extension === ".gif") {
          res.setHeader("Content-Disposition", "inline");
        } else {
          res.setHeader("Content-Disposition", "attachment");
        }
      },
    })
  );

  app.use("/api", routes);

  app.use(errorHandler);

  return app;
};
