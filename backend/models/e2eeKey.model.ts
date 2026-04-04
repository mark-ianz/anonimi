import mongoose, { Schema } from "mongoose";
import { IE2EEKey } from "../types/models";

const e2eeKeySchema = new Schema<IE2EEKey>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    publicKey: { type: String, required: true },
    encryptedPrivateKey: { type: String, required: true },
    iv: { type: String },
    tag: { type: String },
    algorithm: { type: String, default: "RSA-OAEP-256" },
    keyVersion: { type: Number, default: 1 },
  },
  { timestamps: true }
);

e2eeKeySchema.index({ userId: 1 });

export const E2EEKey = mongoose.model<IE2EEKey>("E2EEKey", e2eeKeySchema);
