import { Router } from "express";
import * as groupController from "../controllers/group.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createGroupSchema,
  groupParamsSchema,
  updateGroupSchema,
  addMembersSchema,
  groupMemberParamsSchema,
  changeRoleSchema,
  setNicknameSchema,
} from "../validators/group.validator";

const router = Router();

router.post("/", authenticate, validate(createGroupSchema), groupController.createGroup);
router.get("/:groupId", authenticate, validate(groupParamsSchema), groupController.getGroup);
router.patch("/:groupId", authenticate, validate(groupParamsSchema), validate(updateGroupSchema), groupController.updateGroup);
router.get("/:groupId/members", authenticate, validate(groupParamsSchema), groupController.getGroupMembers);
router.post("/:groupId/members", authenticate, validate(groupParamsSchema), validate(addMembersSchema), groupController.addMembers);
router.delete("/:groupId/members/:userId", authenticate, validate(groupMemberParamsSchema), groupController.removeMember);
router.patch("/:groupId/members/:userId/role", authenticate, validate(groupMemberParamsSchema), validate(changeRoleSchema), groupController.changeRole);
router.post("/:groupId/leave", authenticate, validate(groupParamsSchema), groupController.leaveGroup);
router.patch("/:groupId/nickname", authenticate, validate(groupParamsSchema), validate(setNicknameSchema), groupController.setNickname);

export default router;
