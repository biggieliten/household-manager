import z from "zod";

export const createTaskSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(2),
  frequency: z.int().nonnegative(),
  difficultyLevel: z.int().nonnegative(),
  householdId: z.int().nonnegative(),
});

export const responseTaskSchema = createTaskSchema.extend({
  id: z.int(),
  isArchived: z.boolean(),
  createdAt: z.date(),
});

export const updateTaskSchema = createTaskSchema
  .omit({ householdId: true })
  .extend({ isArchived: z.boolean() })
  .partial();

export type Task = z.infer<typeof responseTaskSchema>;
export type CreateTaskInput = z.input<typeof createTaskSchema>;
export type UpdateTaskInput = z.input<typeof updateTaskSchema>;
