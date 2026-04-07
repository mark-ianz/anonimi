import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import routes from "./routes/index";
import { errorHandler } from "./middleware/errorHandler.middleware";
import { env } from "./config/env";

export const createApp = (): Express => {
  const app = express();

  app.set("trust proxy", 1);

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(",").map(o => o.trim())
    : ["https://anonimi.cloud"];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }));

  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", req.headers.origin || allowedOrigins[0]);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

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
