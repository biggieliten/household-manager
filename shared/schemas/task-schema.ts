import z from "zod";
import { responseMemberSchema } from "./member-schema.ts";
import { responseTaskMediaSchema } from "./task-media-schema.ts";

export const createTaskSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().nullable().optional(),
  frequency: z.int().nonnegative(),
  difficultyLevel: z.int().min(1),
});

export const responseTaskSchema = createTaskSchema.extend({
  id: z.int(),
  householdId: z.int().nonnegative(),
  description: z.string().nullable(),
  isArchived: z.boolean(),
  createdAt: z.coerce.date(),
  // Which of the image and voice note the task has; the files themselves
  // are fetched from /tasks/:taskId/media/:kind
  media: z.array(responseTaskMediaSchema.pick({ kind: true, updatedAt: true })),
});

export const responseTaskListItemSchema = responseTaskSchema.extend({
  completedTasks: z.array(
    z.object({
      completedAt: z.coerce.date(),
      member: responseMemberSchema.pick({
        id: true,
        nickname: true,
        avatar: true,
      }),
    }),
  ),
});

export const updateTaskSchema = createTaskSchema
  .extend({ isArchived: z.boolean() })
  .partial();

export type Task = z.infer<typeof responseTaskSchema>;
export type TaskListItem = z.infer<typeof responseTaskListItemSchema>;
export type CreateTaskBody = z.input<typeof createTaskSchema>;
export type UpdateTaskInput = z.input<typeof updateTaskSchema>;
