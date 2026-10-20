import z from "zod";
import { createMemberSchema, responseMemberSchema } from "./member-schema.ts";

export const createHouseholdSchema = z.object({
  name: z.string().min(2),
});

// Creating a household also creates the creator's membership
export const createMyHouseholdSchema = createHouseholdSchema.extend(
  createMemberSchema.pick({ nickname: true, avatar: true }).shape,
);

const accessCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_-]{8}$/);

export const responseHouseholdSchema = createHouseholdSchema.extend({
  id: z.int(),
  accessCode: accessCodeSchema,
  createdAt: z.date(),
});

// A household the signed-in user belongs to, with their own membership
export const responseMyHouseholdSchema = responseHouseholdSchema
  .pick({ id: true, name: true, accessCode: true })
  .extend({
    member: responseMemberSchema.pick({
      id: true,
      nickname: true,
      avatar: true,
      isAdmin: true,
    }),
  });

export const updateHouseholdSchema = createHouseholdSchema.partial();

export const joinHouseholdSchema = z.object({
  accessCode: accessCodeSchema,
});

// Route params arrive as strings, e.g. /households/:householdId/tasks
export const householdIdParamSchema = z.object({
  householdId: z.coerce.number<string>().int().nonnegative(),
});

// e.g. /households/:householdId/members/:memberId/pause
export const memberIdParamSchema = householdIdParamSchema.extend({
  memberId: z.coerce.number<string>().int().nonnegative(),
});

export type Household = z.infer<typeof responseHouseholdSchema>;
export type MyHousehold = z.infer<typeof responseMyHouseholdSchema>;
export type CreateHouseholdInput = z.input<typeof createHouseholdSchema>;
export type CreateMyHouseholdInput = z.input<typeof createMyHouseholdSchema>;
export type UpdateHouseholdInput = z.input<typeof updateHouseholdSchema>;
export type JoinHouseholdInput = z.input<typeof joinHouseholdSchema>;
