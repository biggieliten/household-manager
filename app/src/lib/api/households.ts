import Storage from "expo-sqlite/kv-store";

import type {
  CreateMyHouseholdInput,
  HouseholdPreview,
  JoinMyHouseholdInput,
  JoinRequest,
  MyHousehold,
  PendingJoinRequest,
  UpdateHouseholdInput,
} from "@shared/schemas/household-schema";
import {
  householdPreviewSchema,
  responseJoinRequestSchema,
  responseMyHouseholdSchema,
  responsePendingJoinRequestSchema,
} from "@shared/schemas/household-schema";
import { getClient } from "./client";
import type { Avatar } from "@shared/schemas/member-schema";

const ACTIVE_HOUSEHOLD_KEY = "active-household-id";

export async function fetchPendingJoinRequests(
  householdId: number,
): Promise<PendingJoinRequest[]> {
  const res = await getClient().api.v1.households[":householdId"][
    "join-requests"
  ].$get({
    param: { householdId: String(householdId) },
  });
  if (!res.ok)
    throw new Error(`Kunde inte hämta förfrågningar (${res.status})`);

  return responsePendingJoinRequestSchema.array().parse(await res.json());
}

export async function fetchMyHouseholds(): Promise<MyHousehold[]> {
  const res = await getClient().api.v1.households.$get();
  if (!res.ok) throw new Error(`Kunde inte hämta hushåll (${res.status})`);

  return responseMyHouseholdSchema.array().parse(await res.json());
}
export async function createHousehold(
  input: CreateMyHouseholdInput,
): Promise<MyHousehold> {
  const res = await getClient().api.v1.households.$post({ json: input });
  if (!res.ok) throw new Error(`Kunde inte skapa hushållet (${res.status})`);

  return responseMyHouseholdSchema.parse(await res.json());
}

export async function fetchHouseholdPreview(
  accessCode: string,
): Promise<HouseholdPreview> {
  const res = await getClient().api.v1.households.join[":accessCode"].$get({
    param: { accessCode },
  });
  if (res.status === 404)
    throw new Error("Det finns inget hushåll med den koden");
  if (res.status === 409)
    throw new Error("Du är redan med i det här hushållet");
  if (!res.ok) throw new Error(`Kunde inte hitta hushållet (${res.status})`);

  return householdPreviewSchema.parse(await res.json());
}

export async function joinHousehold(
  input: JoinMyHouseholdInput,
): Promise<MyHousehold | JoinRequest> {
  const res = await getClient().api.v1.households.join.$post({ json: input });
  if (res.status === 404)
    throw new Error("Det finns inget hushåll med den koden");
  // The code was checked first, so a conflict here is almost always the avatar
  if (res.status === 409)
    throw new Error("Avataren är redan tagen, välj en annan");
  if (!res.ok) throw new Error(`Kunde inte gå med i hushållet (${res.status})`);

  const data: unknown = await res.json();
  const request = responseJoinRequestSchema.safeParse(data);
  return request.success ? request.data : responseMyHouseholdSchema.parse(data);
}

// The stored choice only counts while the user is still a member there
export async function getActiveHouseholdId(
  households: MyHousehold[],
): Promise<number | null> {
  const storedId = Number(await Storage.getItem(ACTIVE_HOUSEHOLD_KEY));
  const active =
    households.find((household) => household.id === storedId) ?? households[0];
  return active?.id ?? null;
}

export async function setActiveHouseholdId(householdId: number) {
  await Storage.setItem(ACTIVE_HOUSEHOLD_KEY, String(householdId));
}

export async function fetchHousehold(householdId: number) {
  const res = await getClient().api.v1.households[":householdId"].$get({
    param: { householdId: String(householdId) },
  });
  if (!res.ok) throw new Error(`Kunde inte hämta hushållet (${res.status})`);

  return res.json();
}

export async function updateHousehold(
  householdId: number,
  input: UpdateHouseholdInput,
): Promise<{ id: number; name: string }> {
  const res = await getClient().api.v1.households[":householdId"].$patch({
    param: { householdId: String(householdId) },
    json: input,
  });
  if (res.status === 400)
    throw new Error("Hushållets namn måste innehålla minst två tecken");
  if (!res.ok) throw new Error(`Kunde inte ändra hushållets namn (${res.status})`);

  return res.json();
}

export async function updateMyNickname(
  householdId: number,
  nickname: string,
) {
  const res = await getClient().api.v1.households[
    ":householdId"
  ].me.nickname.$patch({
    param: { householdId: String(householdId) },
    json: { nickname },
  });
  if (!res.ok) throw new Error(`Kunde inte ändra visningsnamnet (${res.status})`);

  return res.json();
}

export async function pauseMember(householdId: number, memberId: number) {
  const res = await getClient().api.v1.households[":householdId"].members[
    ":memberId"
  ].pause.$post({
    param: { householdId: String(householdId), memberId: String(memberId) },
  });
  if (!res.ok) throw new Error(`Kunde inte pausa medlemmen (${res.status})`);

  return res.json();
}

export async function resumeMember(householdId: number, memberId: number) {
  const res = await getClient().api.v1.households[":householdId"].members[
    ":memberId"
  ].resume.$post({
    param: { householdId: String(householdId), memberId: String(memberId) },
  });
  if (!res.ok)
    throw new Error(`Kunde inte återaktivera medlemmen (${res.status})`);

  return res.json();
}

export async function promoteMember(householdId: number, memberId: number) {
  const res = await getClient().api.v1.households[":householdId"].members[
    ":memberId"
  ].promote.$post({
    param: { householdId: String(householdId), memberId: String(memberId) },
  });
  if (!res.ok)
    throw new Error(`Kunde inte göra medlemmen till ägare (${res.status})`);

  return res.json();
}
export async function leaveHousehold(householdId: number) {
  const res = await getClient().api.v1.households[":householdId"].leave.$post({
    param: { householdId: String(householdId) },
  });
  if (res.status === 409)
    throw new Error(
      "Du måste först utse en ny ägare innan du lämnar hushållet",
    );
  if (!res.ok) throw new Error(`Kunde inte lämna hushållet (${res.status})`);

  return res.json();
}
export async function updateMyAvatar(householdId: number, avatar: Avatar) {
  const res = await getClient().api.v1.households[
    ":householdId"
  ].me.avatar.$patch({
    param: { householdId: String(householdId) },
    json: { avatar },
  });
  if (res.status === 409)
    throw new Error("Avataren är redan tagen, välj en annan");
  if (!res.ok) throw new Error(`Kunde inte byta avatar (${res.status})`);

  return res.json();
}
