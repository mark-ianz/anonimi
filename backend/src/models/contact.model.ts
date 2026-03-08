import mongoose, { Schema, Document, Types } from "mongoose";
import { IContact } from "../types/models";
import { ContactStatus } from "../types/enums";

const contactSchema = new Schema<IContact>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    contactId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    nickname: { type: String },
    status: { type: String, enum: ContactStatus, default: ContactStatus.PENDING },
  },
  { timestamps: true }
);

contactSchema.index({ userId: 1, contactId: 1 }, { unique: true });
contactSchema.index({ userId: 1, status: 1 });
contactSchema.index({ contactId: 1, status: 1 });

export const Contact = mongoose.model<IContact>("Contact", contactSchema);
