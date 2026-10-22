import {
  memberToTaskSchema,
  responseTaskAssignmentSchema,
  type MemberToTask,
  type TaskAssignment,
} from "@shared/schemas/member-to-task-schema";
import { getClient } from "./client";

export async function fetchTaskAssignments(householdId: number): Promise<TaskAssignment[]> {
  const res = await getClient().api.v1.households[":householdId"]["task-assignments"].$get({
    param: { householdId: String(householdId) },
  });
  if (!res.ok) throw new Error(`Kunde inte hämta tilldelningar (${res.status})`);
  return responseTaskAssignmentSchema.array().parse(await res.json());
}

export async function assignTask(householdId: number, assignment: MemberToTask): Promise<MemberToTask> {
  const res = await getClient().api.v1.households[":householdId"]["task-assignments"].$post({
    param: { householdId: String(householdId) },
    json: assignment,
  });
  if (!res.ok) throw new Error(`Kunde inte tilldela sysslan (${res.status})`);
  return memberToTaskSchema.parse(await res.json());
}

export async function removeTaskAssignment(householdId: number, assignment: MemberToTask): Promise<MemberToTask> {
  const res = await getClient().api.v1.households[":householdId"]["task-assignments"][":taskId"][":memberId"].$delete({
    param: {
      householdId: String(householdId),
      taskId: String(assignment.taskId),
      memberId: String(assignment.memberId),
    },
  });
  if (!res.ok) throw new Error(`Kunde inte ta bort tilldelningen (${res.status})`);
  return memberToTaskSchema.parse(await res.json());
}
