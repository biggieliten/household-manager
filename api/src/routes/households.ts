import { Hono } from "hono";
import {
  createMyHouseholdSchema,
  householdIdParamSchema,
  joinHouseholdSchema,
  joinMyHouseholdSchema,
  joinRequestIdParamSchema,
  memberIdParamSchema,
  updateHouseholdSchema,
} from "../../../shared/schemas/household-schema.ts";
import {
  updateAvatarSchema,
  updateMyNicknameSchema,
} from "../../../shared/schemas/member-schema.ts";
import { db } from "../lib/prisma.ts";
import { validate } from "../lib/validate.ts";
import {
  requireSession,
  sessionControl,
} from "../middleware/sessioncontrol.ts";
import { Prisma } from "../generated/prisma/client.ts";

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

// An active member of the household, with their ongoing pause if any
function findActiveMember(householdId: number, memberId: number) {
  return db.member.findFirst({
    where: { id: memberId, householdId, leftAt: null },
    include: { pauses: { where: { endDate: null, deletedAt: null } } },
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

      // A household nobody is left in needs a new owner.
      if (household.members.length === 0) {
        // Someone who left gets their old membership back, keeping their history.
        const formerMember = await db.member.findFirst({
          where: {
            userId: user.id,
            householdId: household.id,
            leftAt: { not: null },
          },
          orderBy: { leftAt: "desc" },
          select: { id: true },
        });
        const select = {
          id: true,
          nickname: true,
          avatar: true,
          isAdmin: true,
        } as const;

        try {
          const member = formerMember
            ? await db.member.update({
                where: { id: formerMember.id },
                data: { nickname, avatar, isAdmin: true, leftAt: null },
                select,
              })
            : await db.member.create({
                data: {
                  userId: user.id,
                  householdId: household.id,
                  nickname,
                  avatar,
                  isAdmin: true,
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
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
          ) {
            return c.json({ error: "Avatar is taken" }, 409);
          }
          throw error;
        }
      }

      const request = await db.joinRequest.upsert({
        where: {
          userId_householdId: {
            userId: user.id,
            householdId: household.id,
          },
        },
        create: {
          userId: user.id,
          householdId: household.id,
          nickname,
          avatar,
        },
        update: { nickname, avatar },
        select: { id: true, householdId: true },
      });

      return c.json(
        {
          ...request,
          status: "PENDING" as const,
        },
        200,
      );
    },
  )
  .get(
    "/:householdId/join-requests",
    sessionControl(true),
    validate("param", householdIdParamSchema),
    async (c) => {
      const { householdId } = c.req.valid("param");

      const requests = await db.joinRequest.findMany({
        where: { householdId },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: { id: true, nickname: true, avatar: true },
      });

      return c.json(requests, 200);
    },
  )
  .post(
    "/:householdId/join-requests/:requestId/accept",
    sessionControl(true),
    validate("param", joinRequestIdParamSchema),
    async (c) => {
      const { householdId, requestId } = c.req.valid("param");

      try {
        const result = await db.$transaction(async (tx) => {
          const request = await tx.joinRequest.findFirst({
            where: { id: requestId, householdId },
          });
          if (!request) {
            return { status: 404 as const, error: "Förfrågan finns inte kvar." };
          }

          const competingRequest = await tx.joinRequest.findFirst({
            where: {
              householdId,
              avatar: request.avatar,
              id: { not: requestId },
            },
            select: { id: true },
          });
          if (competingRequest) {
            return {
              status: 409 as const,
              error:
                "Flera personer har valt samma avatar. Neka de andra förfrågningarna först.",
            };
          }

          const avatarTaken = await tx.member.findFirst({
            where: { householdId, avatar: request.avatar, leftAt: null },
            select: { id: true },
          });
          if (avatarTaken) {
            return {
              status: 409 as const,
              error: "En medlem använder redan den här avataren. Förfrågan kan inte godkännas.",
            };
          }

          const membership = await tx.member.findUnique({
            where: {
              userId_householdId: { userId: request.userId, householdId },
            },
            select: { id: true, leftAt: true },
          });
          if (membership && membership.leftAt === null) {
            return {
              status: 409 as const,
              error: "Användaren är redan medlem i hushållet.",
            };
          }

          // Deleting and granting membership must either both succeed or roll back.
          await tx.joinRequest.delete({ where: { id: requestId, householdId } });
          const data = {
            nickname: request.nickname,
            avatar: request.avatar,
            isAdmin: false,
            leftAt: null,
          };
          if (membership) {
            await tx.member.update({ where: { id: membership.id }, data });
          } else {
            await tx.member.create({
              data: { ...data, userId: request.userId, householdId },
            });
          }

          return { status: 200 as const };
        });

        if (result.status !== 200) {
          return c.json({ error: result.error }, result.status);
        }
        return c.json({ success: true }, 200);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2002") {
            return c.json(
              { error: "Avataren eller medlemskapet används redan. Uppdatera listan och försök igen." },
              409,
            );
          }
          if (error.code === "P2025") {
            return c.json({ error: "Förfrågan finns inte kvar." }, 404);
          }
          if (error.code === "P2034") {
            return c.json(
              { error: "Förfrågan ändrades samtidigt. Uppdatera listan och försök igen." },
              409,
            );
          }
        }
        throw error;
      }
    },
  )
  .post(
    "/:householdId/join-requests/:requestId/reject",
    sessionControl(true),
    validate("param", joinRequestIdParamSchema),
    async (c) => {
      const { householdId, requestId } = c.req.valid("param");
      const result = await db.joinRequest.deleteMany({
        where: { id: requestId, householdId },
      });
      if (result.count === 0) {
        return c.json({ error: "Förfrågan finns inte kvar." }, 404);
      }
      return c.json({ success: true }, 200);
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
  .patch(
    "/:householdId",
    sessionControl(true),
    validate("param", householdIdParamSchema),
    validate("json", updateHouseholdSchema),
    async (c) => {
      const { householdId } = c.req.valid("param");
      const body = c.req.valid("json");

      const household = await db.household.update({
        where: { id: householdId, deletedAt: null },
        data: body,
        select: { id: true, name: true },
      });

      return c.json(household, 200);
    },
  )
  .patch(
    "/:householdId/me/nickname",
    sessionControl(),
    validate("param", householdIdParamSchema),
    validate("json", updateMyNicknameSchema),
    async (c) => {
      const { nickname } = c.req.valid("json");
      const { member: me } = c.var;

      const member = await db.member.update({
        where: { id: me.id },
        data: { nickname },
        select: { id: true, nickname: true },
      });

      return c.json(member, 200);
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

      try {
        const member = await db.member.update({
          where: { id: me.id },
          data: { avatar },
          select: { id: true, nickname: true, avatar: true, isAdmin: true },
        });
        return c.json(member, 200);
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          return c.json({ error: "Avatar is taken" }, 409);
        }
        throw error;
      }
    },
  )

  .post(
    "/:householdId/members/:memberId/pause",
    sessionControl(true),
    validate("param", memberIdParamSchema),
    async (c) => {
      const { householdId, memberId } = c.req.valid("param");

      const member = await findActiveMember(householdId, memberId);

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

      const member = await findActiveMember(householdId, memberId);

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
