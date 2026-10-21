import type { Avatar } from "@shared/schemas/member-schema";

export interface MemberStatistics {
  id: number;
  nickname: string;
  avatar: Avatar;
  points: number;
}

export interface TaskStatistics {
  id: number;
  name: string;
  // Number of times the task has been completed
  count: number;
  // Same order as `HouseholdStatistics.members`
  pointsByMember: number[];
}

export interface HouseholdStatistics {
  totalPoints: number;
  members: MemberStatistics[];
  tasks: TaskStatistics[];
}
