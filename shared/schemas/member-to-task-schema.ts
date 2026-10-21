import z from "zod";

export const memberToTaskSchema = z.object({
  memberId: z.int().nonnegative(),
  taskId: z.int().nonnegative(),
});

export type MemberToTask = z.infer<typeof memberToTaskSchema>;
export type CreateMemberToTaskInput = z.input<typeof memberToTaskSchema>;

export const responseTaskAssignmentSchema = memberToTaskSchema.extend({
  isManual: z.boolean(),
  groups: z.array(z.object({ id: z.int(), name: z.string() })),
});

export type TaskAssignment = z.infer<typeof responseTaskAssignmentSchema>;
