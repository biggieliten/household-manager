import z from "zod";

export const createTaskSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().min(2),
  frequency: z.int().nonnegative(),
  difficultyLevel: z.int().min(1),
  householdId: z.int().nonnegative(),
});

export const responseTaskSchema = createTaskSchema.extend({
  id: z.int(),
  isArchived: z.boolean(),
  createdAt: z.coerce.date(),
});

export const updateTaskSchema = createTaskSchema
  .omit({ householdId: true })
  .extend({ isArchived: z.boolean() })
  .partial();

export type Task = z.infer<typeof responseTaskSchema>;
export type CreateTaskInput = z.input<typeof createTaskSchema>;
export type UpdateTaskInput = z.input<typeof updateTaskSchema>;

//create-task takes household id from the url
export const createTaskBodySchema = createTaskSchema.omit({
  householdId: true,
});
export type CreateTaskBody = z.input<typeof createTaskBodySchema>;
