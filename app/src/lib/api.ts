import type { HouseholdStatistics } from "@/types/statistics";
import { responseTaskSchema } from "@shared/schemas/task-schema";
import type { CreateTaskBody, Task } from "@shared/schemas/task-schema";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// TODO: replace with the active household once auth/household selection exists
export const HOUSEHOLD_ID = 1;

export async function fetchHouseholdStatistics(
  householdId: number,
): Promise<HouseholdStatistics> {
  if (!API_URL) throw new Error("EXPO_PUBLIC_API_URL saknas i app/.env");

  const res = await fetch(`${API_URL}/households/${householdId}/statistics`);
  if (!res.ok) throw new Error(`Kunde inte hämta statistik (${res.status})`);

  return res.json() as Promise<HouseholdStatistics>;
}

export async function createTask(
  householdId: number,
  body: CreateTaskBody,
): Promise<Task> {
  if (!API_URL) throw new Error("EXPO_PUBLIC_API_URL saknas i app/.env");

  const res = await fetch(`${API_URL}/households/${householdId}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Kunde inte skapa syssla (${res.status})`);

  return responseTaskSchema.parse(await res.json());
}
