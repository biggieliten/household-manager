import { Hono } from "hono";
import {
  householdIdParamSchema,
  memberIdParamSchema,
  createMyHouseholdSchema,
  joinHouseholdSchema,
  joinMyHouseholdSchema,
  updateAvatarSchema,
} from "../../../shared/schemas/household-schema.ts";
import { db } from "../lib/prisma.ts";
import { validate } from "../lib/validate.ts";
import {
  requireSession,
  sessionControl,
} from "../middleware/sessioncontrol.ts";

// A household by its code, with the members still in it
function findHouseholdByCode(accessCode: string) {
  return db.household.findFirst({
    where: { accessCode, deletedAt: null },
    select: {
      id: true,
      name: true,
      accessCode: true,
      members: {
        where: { leftAt: null },
        select: { userId: true, avatar: true },
      },
    },
  });
}

const app = new Hono()
  // Households the signed-in user is an active member of, with their own membership
  .get("/", requireSession(), async (c) => {
    const user = c.get("user");

    const members = await db.member.findMany({
      where: {
        userId: user.id,
        leftAt: null,
        household: { deletedAt: null },
      },
      orderBy: { householdId: "asc" },
      select: {
        id: true,
        nickname: true,
        avatar: true,
        isAdmin: true,
        household: { select: { id: true, name: true, accessCode: true } },
      },
    });

    return c.json(
      members.map(({ household, ...member }) => ({ ...household, member })),
      200,
    );
  })
  // Creates a household with the signed-in user as its first owner
  .post(
    "/",
    requireSession(),
    validate("json", createMyHouseholdSchema),
    async (c) => {
      const user = c.get("user");
      const { name, nickname, avatar } = c.req.valid("json");

      const household = await db.household.create({
        data: {
          name,
          members: {
            create: { userId: user.id, nickname, avatar, isAdmin: true },
          },
        },
        select: {
          id: true,
          name: true,
          accessCode: true,
          members: {
            select: { id: true, nickname: true, avatar: true, isAdmin: true },
          },
        },
      });

      const { members, ...rest } = household;
      return c.json({ ...rest, member: members[0] }, 201);
    },
  )
  // Checks a code before joining: the household and the avatars already in use
  .get(
    "/join/:accessCode",
    requireSession(),
    validate("param", joinHouseholdSchema),
    async (c) => {
      const user = c.get("user");
      const { accessCode } = c.req.valid("param");

      const household = await findHouseholdByCode(accessCode);
      if (!household) {
        return c.json({ error: "Household not found" }, 404);
      }
      if (household.members.some((member) => member.userId === user.id)) {
        return c.json({ error: "Already a member" }, 409);
      }

      return c.json(
        {
          id: household.id,
          name: household.name,
          takenAvatars: household.members.map((member) => member.avatar),
        },
        200,
      );
    },
  )
  .post(
    "/join",
    requireSession(),
    validate("json", joinMyHouseholdSchema),
    async (c) => {
      const user = c.get("user");
      const { accessCode, nickname, avatar } = c.req.valid("json");

      const household = await findHouseholdByCode(accessCode);
      if (!household) {
        return c.json({ error: "Household not found" }, 404);
      }
      if (household.members.some((member) => member.userId === user.id)) {
        return c.json({ error: "Already a member" }, 409);
      }
      if (household.members.some((member) => member.avatar === avatar)) {
        return c.json({ error: "Avatar is taken" }, 409);
      }

      // Someone who left gets their old membership back, keeping their history
      const formerMember = await db.member.findFirst({
        where: {
          userId: user.id,
          householdId: household.id,
          leftAt: { not: null },
        },
        orderBy: { leftAt: "desc" },
        select: { id: true },
      });

      // A household nobody is left in needs a new owner
      const isAdmin = household.members.length === 0;
      const select = {
        id: true,
        nickname: true,
        avatar: true,
        isAdmin: true,
      } as const;

      const member = formerMember
        ? await db.member.update({
            where: { id: formerMember.id },
            data: { nickname, avatar, isAdmin, leftAt: null },
            select,
          })
        : await db.member.create({
            data: {
              userId: user.id,
              householdId: household.id,
              nickname,
              avatar,
              isAdmin,
            },
            select,
          });

      return c.json(
        {
          id: household.id,
          name: household.name,
          accessCode: household.accessCode,
          member,
        },
        200,
      );
    },
  )
  .get(
    "/:householdId",
    sessionControl(),
    validate("param", householdIdParamSchema),
    async (c) => {
      const { householdId } = c.req.valid("param");
      const { member: me } = c.var;

      const household = await db.household.findUnique({
        where: { id: householdId },
        include: {
          members: {
            where: { leftAt: null },
            orderBy: { id: "asc" },
            select: {
              id: true,
              nickname: true,
              avatar: true,
              isAdmin: true,
              pauses: {
                where: { endDate: null, deletedAt: null },
                select: { id: true },
              },
            },
          },
        },
      });
      if (!household) {
        return c.json({ error: "Household not found" }, 404);
      }

      return c.json(
        {
          id: household.id,
          name: household.name,
          accessCode: household.accessCode,
          members: household.members.map(({ pauses, ...member }) => ({
            ...member,
            isMe: member.id === me.id,
            isPaused: pauses.length > 0,
          })),
        },
        200,
      );
    },
  )
  // Changes the signed-in member's avatar, if no one else in the household has it
  .patch(
    "/:householdId/me/avatar",
    sessionControl(),
    validate("param", householdIdParamSchema),
    validate("json", updateAvatarSchema),
    async (c) => {
      const { householdId } = c.req.valid("param");
      const { avatar } = c.req.valid("json");
      const { member: me } = c.var;

      const taken = await db.member.findFirst({
        where: { householdId, avatar, leftAt: null, id: { not: me.id } },
        select: { id: true },
      });
      if (taken) {
        return c.json({ error: "Avatar is taken" }, 409);
      }

      const member = await db.member.update({
        where: { id: me.id },
        data: { avatar },
        select: { id: true, nickname: true, avatar: true, isAdmin: true },
      });

      return c.json(member, 200);
    },
  )

  .post(
    "/:householdId/members/:memberId/pause",
    sessionControl(true),
    validate("param", memberIdParamSchema),
    async (c) => {
      const { householdId, memberId } = c.req.valid("param");

      const member = await db.member.findFirst({
        where: { id: memberId, householdId, leftAt: null },
        include: { pauses: { where: { endDate: null, deletedAt: null } } },
      });
      if (!member) {
        return c.json({ error: "Member not found" }, 404);
      }
      if (member.isAdmin) {
        return c.json({ error: "Admins cannot be paused" }, 403);
      }
      if (member.pauses.length > 0) {
        return c.json({ error: "Member is already paused" }, 409);
      }

      const pause = await db.pause.create({ data: { memberId } });

      return c.json(pause, 201);
    },
  )
  .post(
    "/:householdId/members/:memberId/resume",
    sessionControl(true),
    validate("param", memberIdParamSchema),
    async (c) => {
      const { householdId, memberId } = c.req.valid("param");

      const activePause = await db.pause.findFirst({
        where: {
          memberId,
          endDate: null,
          deletedAt: null,
          member: { householdId, leftAt: null },
        },
      });
      if (!activePause) {
        return c.json({ error: "Member is not paused" }, 404);
      }

      const pause = await db.pause.update({
        where: { id: activePause.id },
        data: { endDate: new Date() },
      });

      return c.json(pause, 200);
    },
  )
  .post(
    "/:householdId/members/:memberId/promote",
    sessionControl(true),
    validate("param", memberIdParamSchema),
    async (c) => {
      const { householdId, memberId } = c.req.valid("param");

      const member = await db.member.findFirst({
        where: { id: memberId, householdId, leftAt: null },
        include: { pauses: { where: { endDate: null, deletedAt: null } } },
      });
      if (!member) {
        return c.json({ error: "Member not found" }, 404);
      }
      if (member.isAdmin) {
        return c.json({ error: "Member is already an admin" }, 409);
      }
      if (member.pauses.length > 0) {
        return c.json({ error: "Paused members cannot be promoted" }, 409);
      }

      const promoted = await db.member.update({
        where: { id: memberId },
        data: { isAdmin: true },
      });

      return c.json(promoted, 200);
    },
  )
  .post(
    "/:householdId/leave",
    sessionControl(),
    validate("param", householdIdParamSchema),
    async (c) => {
      const { householdId } = c.req.valid("param");
      const { member: me } = c.var;

      // The last owner must appoint a new owner first, unless no one else is left
      if (me.isAdmin) {
        const otherMembers = await db.member.findMany({
          where: { householdId, leftAt: null, id: { not: me.id } },
          select: { isAdmin: true },
        });
        const hasOtherOwner = otherMembers.some((member) => member.isAdmin);
        if (otherMembers.length > 0 && !hasOtherOwner) {
          return c.json({ error: "Appoint a new owner before leaving" }, 409);
        }
      }

      const member = await db.member.update({
        where: { id: me.id },
        data: { leftAt: new Date() },
      });

      return c.json(member, 200);
    },
  );

export default app;
