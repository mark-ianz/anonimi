import { Request, Response, NextFunction } from "express";
import { E2EEKey } from "../models/e2eeKey.model";
import { NotFoundError } from "../utils/apiError";

export const registerE2EEKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req.user as any)?._id?.toString();
    if (!userId) {
      res.status(401).json({ error: { message: "Not authenticated" } });
      return;
    }

    const { publicKey, encryptedPrivateKey, iv, tag } = req.body;

    if (!publicKey || !encryptedPrivateKey) {
      res.status(400).json({ error: { message: "Missing required key fields" } });
      return;
    }

    const existing = await E2EEKey.findOne({ userId }).lean();
    if (existing) {
      const updated = await E2EEKey.findOneAndUpdate(
        { userId },
        { publicKey, encryptedPrivateKey, iv, tag, keyVersion: (existing.keyVersion || 1) + 1 },
        { new: true }
      );
      res.json({ data: updated });
      return;
    }

    const key = await E2EEKey.create({
      userId,
      publicKey,
      encryptedPrivateKey,
      iv,
      tag,
    });

    res.status(201).json({ data: key });
  } catch (error) {
    next(error);
  }
};

export const getE2EEKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.params;

    const key = await E2EEKey.findOne({ userId }).select("userId publicKey keyVersion").lean();
    if (!key) {
      throw new NotFoundError("E2EE public key not found for user");
    }

    res.json({
      data: {
        userId: key.userId.toString(),
        publicKey: key.publicKey,
        keyVersion: key.keyVersion,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyE2EEKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req.user as any)?._id?.toString();
    if (!userId) {
      res.status(401).json({ error: { message: "Not authenticated" } });
      return;
    }

    const key = await E2EEKey.findOne({ userId }).select("userId publicKey keyVersion").lean();
    if (!key) {
      throw new NotFoundError("No E2EE key registered");
    }

    res.json({
      data: {
        userId: key.userId.toString(),
        publicKey: key.publicKey,
        keyVersion: key.keyVersion,
      },
    });
  } catch (error) {
    next(error);
  }
};
