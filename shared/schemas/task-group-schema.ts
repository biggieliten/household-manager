import z from "zod";

export const taskGroupBodySchema = z.object({
  name: z.string().trim().min(2),
  intervalDays: z.int().positive(),
  startDate: z.iso.date(),
  taskIds: z.array(z.int().positive()).min(1),
  memberIds: z.array(z.int().positive()).min(1),
});

export const responseTaskGroupSchema = taskGroupBodySchema.extend({
  id: z.int(),
  householdId: z.int(),
  memberIds: z.array(z.int().positive()),
  currentMemberId: z.int().nullable(),
});

export type TaskGroupBody = z.infer<typeof taskGroupBodySchema>;
export type TaskGroup = z.infer<typeof responseTaskGroupSchema>;
