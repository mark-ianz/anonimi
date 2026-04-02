import http from "http";
import { createApp } from "./app";
import connectDB from "./config/db";
import { createSocketServer } from "./config/socket";
import { setupSocket } from "./socket/index";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { startStealthExpiryJob } from "./services/stealth.service";
import { startTemporaryAccountCleanupJob } from "./services/temporaryAccount.service";

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    const app = createApp();
    const server = http.createServer(app);

    const io = createSocketServer(server);
    setupSocket(io);
    startStealthExpiryJob();
    startTemporaryAccountCleanupJob();

    server.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT}`);
    });

    process.on("SIGTERM", () => {
      logger.info("SIGTERM received, closing server...");
      server.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
