import z from "zod";
import { householdIdParamSchema } from "./household-schema.ts";

export const completionParamSchema = householdIdParamSchema.extend({
  taskId: z.coerce.number<string>().int().positive(),
});

export const createCompletedTaskSchema = z.object({
  taskId: z.int().nonnegative(),
  memberId: z.int().nonnegative(),
});

export const responseCompletedTaskSchema = createCompletedTaskSchema.extend({
  id: z.int(),
  completedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
});

export type CompletedTask = z.infer<typeof responseCompletedTaskSchema>;
export type CreateCompletedTaskInput = z.input<
  typeof createCompletedTaskSchema
>;
