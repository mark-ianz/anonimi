import { v2 as cloudinary } from "cloudinary";
import { v4 as uuidv4 } from "uuid";
import type { UploadCategory } from "../middleware/upload.middleware";
import { env } from "../config/env";

let configured = false;

const getFolderName = (category: UploadCategory): string => {
  if (category === "avatar") return "avatars";
  if (category === "group") return "groups";
  return "messages";
};

const getUploadFolder = (category: UploadCategory): string => {
  const parts = [env.CLOUDINARY_FOLDER?.trim(), getFolderName(category)].filter(Boolean);
  return parts.join("/");
};

const ensureCloudinaryConfigured = (): void => {
  if (configured) return;

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  configured = true;
};

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  resourceType: string;
  bytes: number;
  originalFilename: string;
}

export const uploadFileToCloudinary = async (
  file: Express.Multer.File,
  category: UploadCategory
): Promise<CloudinaryUploadResult> => {
  ensureCloudinaryConfigured();

  const options = {
    folder: getUploadFolder(category),
    resource_type: "auto" as const,
    public_id: uuidv4(),
    overwrite: false,
    use_filename: false,
    unique_filename: false,
  };

  const result = await new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      if (!response) {
        reject(new Error("Cloudinary upload did not return a response."));
        return;
      }

      resolve(response);
    });

    stream.end(file.buffer);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
    bytes: result.bytes,
    originalFilename: result.original_filename,
  };
};
