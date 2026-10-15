export type Avatar =
  | "FOX"
  | "PIG"
  | "FROG"
  | "CHICKEN"
  | "OCTOPUS"
  | "DOLPHIN"
  | "OWL"
  | "UNICORN";

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
