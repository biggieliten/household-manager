import z from "zod";

export const createCompletedTaskSchema = z.object({
  taskId: z.int().nonnegative(),
  memberId: z.int().nonnegative(),
});

export const responseCompletedTaskSchema = createCompletedTaskSchema.extend({
  id: z.int(),
  completedAt: z.date(),
  createdAt: z.date(),
});

export type CompletedTask = z.infer<typeof responseCompletedTaskSchema>;
export type CreateCompletedTaskInput = z.input<typeof createCompletedTaskSchema>;
