import z from "zod";

export const createHouseholdSchema = z.object({
  name: z.string().min(2),
});

const accessCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_-]{8}$/);

export const responseHouseholdSchema = createHouseholdSchema.extend({
  id: z.int(),
  accessCode: accessCodeSchema,
  createdAt: z.date(),
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
export type CreateHouseholdInput = z.input<typeof createHouseholdSchema>;
export type UpdateHouseholdInput = z.input<typeof updateHouseholdSchema>;
export type JoinHouseholdInput = z.input<typeof joinHouseholdSchema>;
