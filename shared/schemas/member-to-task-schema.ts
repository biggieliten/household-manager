import z from "zod";

// Assignment of a task to a member; has no fields of its own
export const memberToTaskSchema = z.object({
  memberId: z.int().nonnegative(),
  taskId: z.int().nonnegative(),
});

export type MemberToTask = z.infer<typeof memberToTaskSchema>;
export type CreateMemberToTaskInput = z.input<typeof memberToTaskSchema>;
