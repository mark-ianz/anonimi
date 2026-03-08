import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = req.body.category || "message";
    let uploadPath = env.UPLOAD_DIR;

    if (category === "avatar") {
      uploadPath = path.join(uploadPath, "avatars");
    } else if (category === "group") {
      uploadPath = path.join(uploadPath, "groups");
    } else {
      uploadPath = path.join(uploadPath, "messages");
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const allowedDocTypes = [
    "application/pdf",
    "application/zip",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else if (allowedDocTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(env.MAX_FILE_SIZE, 10),
  },
});
