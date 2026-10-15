import z from "zod";

export const avatarSchema = z.enum([
  "FOX",
  "PIG",
  "FROG",
  "CHICKEN",
  "OCTOPUS",
  "DOLPHIN",
  "OWL",
  "UNICORN",
]);

export const createMemberSchema = z.object({
  nickname: z.string().min(2),
  avatar: avatarSchema,
  householdId: z.int().nonnegative(),
});

export const responseMemberSchema = createMemberSchema.extend({
  id: z.int(),
  userId: z.string(),
  isAdmin: z.boolean(),
  leftAt: z.date().nullable(),
  createdAt: z.date(),
});

export const updateMemberSchema = createMemberSchema
  .omit({ householdId: true })
  .partial();

export type Avatar = z.infer<typeof avatarSchema>;
export type Member = z.infer<typeof responseMemberSchema>;
export type CreateMemberInput = z.input<typeof createMemberSchema>;
export type UpdateMemberInput = z.input<typeof updateMemberSchema>;
