import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import routes from "./routes/index";
import { errorHandler } from "./middleware/errorHandler.middleware";

export const createApp = (): Express => {
  const app = express();

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  }));

  app.use("/api", routes);

  app.use(errorHandler);

  return app;
};
