import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import contactRoutes from "./contact.routes";
import conversationRoutes from "./conversation.routes";
import messageRoutes from "./message.routes";
import messageRequestRoutes from "./messageRequest.routes";
import groupRoutes from "./group.routes";
import blockRoutes from "./block.routes";
import reportRoutes from "./report.routes";
import supportRoutes from "./support.routes";
import mediaRoutes from "./media.routes";
import adminRoutes from "./admin.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/contacts", contactRoutes);
router.use("/conversations", conversationRoutes);
router.use("/messages", messageRoutes);
router.use("/message-requests", messageRequestRoutes);
router.use("/groups", groupRoutes);
router.use("/blocks", blockRoutes);
router.use("/reports", reportRoutes);
router.use("/support", supportRoutes);
router.use("/media", mediaRoutes);
router.use("/admin", adminRoutes);

router.get("/health", (req, res) => {
  res.json({
    success: true,
    data: {
      status: "healthy",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
