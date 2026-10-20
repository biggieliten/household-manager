import { getClient } from "./client";

export async function fetchHousehold(householdId: number) {
  const res = await getClient().api.v1.households[":householdId"].$get({
    param: { householdId: String(householdId) },
  });
  if (!res.ok) throw new Error(`Kunde inte hämta hushållet (${res.status})`);

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
