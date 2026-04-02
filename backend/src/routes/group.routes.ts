import { Router } from "express";
import * as groupController from "../controllers/group.controller";
import { authenticate } from "../middleware/auth.middleware";
import { requireFullAccount } from "../middleware/requireFullAccount.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createGroupSchema,
  groupParamsSchema,
  updateGroupSchema,
  addMembersSchema,
  groupMemberParamsSchema,
  changeRoleSchema,
  setNicknameSchema,
  joinRequestDecisionSchema,
  groupJoinRequestParamsSchema,
  createInviteLinkSchema,
  inviteLinkParamsSchema,
  inviteTokenParamsSchema,
  transferOwnerSchema,
  muteMemberSchema,
} from "../validators/group.validator";

const router = Router();

router.post(
  "/",
  authenticate,
  requireFullAccount,
  validate(createGroupSchema),
  groupController.createGroup
);
router.get("/join/:token", validate(inviteTokenParamsSchema), groupController.getGroupInfoByToken);
router.post("/join/:token", authenticate, validate(inviteTokenParamsSchema), groupController.joinByInviteToken);
router.get("/:groupId", authenticate, validate(groupParamsSchema), groupController.getGroup);
router.patch("/:groupId", authenticate, validate(groupParamsSchema), validate(updateGroupSchema), groupController.updateGroup);
router.delete("/:groupId", authenticate, validate(groupParamsSchema), groupController.disbandGroup);
router.get("/:groupId/members", authenticate, validate(groupParamsSchema), groupController.getGroupMembers);
router.post("/:groupId/members", authenticate, validate(groupParamsSchema), validate(addMembersSchema), groupController.addMembers);
router.delete("/:groupId/members/:userId", authenticate, validate(groupMemberParamsSchema), groupController.removeMember);
router.patch("/:groupId/members/:userId/role", authenticate, validate(groupMemberParamsSchema), validate(changeRoleSchema), groupController.changeRole);
router.patch("/:groupId/members/:userId/nickname", authenticate, validate(groupMemberParamsSchema), validate(setNicknameSchema), groupController.setMemberNickname);
router.post("/:groupId/members/:userId/mute", authenticate, validate(groupMemberParamsSchema), validate(muteMemberSchema), groupController.muteMember);
router.delete("/:groupId/members/:userId/mute", authenticate, validate(groupMemberParamsSchema), groupController.unmuteMember);
router.post("/:groupId/leave", authenticate, validate(groupParamsSchema), groupController.leaveGroup);
router.patch("/:groupId/transfer-owner", authenticate, validate(groupParamsSchema), validate(transferOwnerSchema), groupController.transferOwnership);
router.patch("/:groupId/nickname", authenticate, validate(groupParamsSchema), validate(setNicknameSchema), groupController.setNickname);
router.post("/:groupId/join-request", authenticate, validate(groupParamsSchema), groupController.createJoinRequest);
router.get("/:groupId/join-requests", authenticate, validate(groupParamsSchema), groupController.listJoinRequests);
router.patch("/:groupId/join-requests/:requestId", authenticate, validate(groupJoinRequestParamsSchema), validate(joinRequestDecisionSchema), groupController.decideJoinRequest);
router.post("/:groupId/invite-links", authenticate, validate(groupParamsSchema), validate(createInviteLinkSchema), groupController.createInviteLink);
router.get("/:groupId/invite-links", authenticate, validate(groupParamsSchema), groupController.listInviteLinks);
router.delete("/:groupId/invite-links/:inviteLinkId", authenticate, validate(inviteLinkParamsSchema), groupController.revokeInviteLink);

export default router;
