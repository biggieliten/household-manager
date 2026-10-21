import type {
  MemberToTask,
  TaskAssignment,
} from "../../../shared/schemas/member-to-task-schema.ts";

type RotationGroup = {
  id: number;
  name: string;
  startDate: Date;
  intervalDays: number;
  tasks: { id: number }[];
  memberIds: number[];
};

type RotationMember = {
  id: number;
  isPaused: boolean;
};

export function getRotationMemberId(
  group: Pick<RotationGroup, "startDate" | "intervalDays" | "memberIds">,
  members: readonly RotationMember[],
  now: Date,
): number | null {
  const available = members
    .filter((member) => group.memberIds.includes(member.id) && !member.isPaused)
    .sort((a, b) => a.id - b.id);
  const elapsedDays = Math.floor(
    (now.getTime() - group.startDate.getTime()) / 86_400_000,
  );
  if (elapsedDays < 0 || available.length === 0) return null;

  const interval = Math.floor(elapsedDays / group.intervalDays);
  return available[interval % available.length].id;
}

export function combineTaskAssignments(
  manual: readonly MemberToTask[],
  groups: readonly RotationGroup[],
  members: readonly RotationMember[],
  now: Date,
): TaskAssignment[] {
  const assignments = new Map<string, TaskAssignment>();
  const key = (memberId: number, taskId: number) => `${memberId}:${taskId}`;

  for (const assignment of manual) {
    assignments.set(key(assignment.memberId, assignment.taskId), {
      ...assignment,
      isManual: true,
      group: null,
    });
  }

  for (const group of groups) {
    const memberId = getRotationMemberId(group, members, now);
    if (memberId === null) continue;

    for (const task of group.tasks) {
      const assignmentKey = key(memberId, task.id);
      assignments.set(assignmentKey, {
        memberId,
        taskId: task.id,
        isManual: assignments.get(assignmentKey)?.isManual ?? false,
        group: { id: group.id, name: group.name },
      });
    }
  }

  return Array.from(assignments.values()).sort(
    (a, b) => a.taskId - b.taskId || a.memberId - b.memberId,
  );
}
