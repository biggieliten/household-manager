import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { combineTaskAssignments, getRotationMemberId } from "./task-rotation.ts";

const startDate = new Date("2026-10-01T00:00:00Z");
const group = {
  id: 1,
  name: "Köket",
  startDate,
  intervalDays: 2,
  tasks: [{ id: 10 }, { id: 11 }],
  memberIds: [1, 2, 3],
};
const members = [
  { id: 3, isPaused: false },
  { id: 1, isPaused: false },
  { id: 2, isPaused: false },
];
const day = (days: number) => new Date(startDate.getTime() + days * 86_400_000);

describe("getRotationMemberId", () => {
  it("starts with the first member by id", () => {
    assert.equal(getRotationMemberId(group, members, day(0)), 1);
  });

  it("changes member exactly when the interval passes", () => {
    const justBefore = new Date(day(2).getTime() - 1);
    assert.equal(getRotationMemberId(group, members, justBefore), 1);
    assert.equal(getRotationMemberId(group, members, day(2)), 2);
  });

  it("wraps around over multiple rotations", () => {
    assert.equal(getRotationMemberId(group, members, day(6)), 1);
    assert.equal(getRotationMemberId(group, members, day(16)), 3);
  });

  it("skips paused members", () => {
    const pausedMembers = members.map((member) => ({
      ...member,
      isPaused: member.id === 2,
    }));
    assert.equal(getRotationMemberId(group, pausedMembers, day(2)), 3);
    assert.equal(getRotationMemberId(group, pausedMembers, day(4)), 1);
  });

  it("returns no member before the start or without available members", () => {
    assert.equal(getRotationMemberId(group, members, day(-1)), null);
    assert.equal(getRotationMemberId(group, [], day(0)), null);
    assert.equal(
      getRotationMemberId(group, [{ id: 1, isPaused: true }], day(0)),
      null,
    );
  });
});

describe("combineTaskAssignments", () => {
  it("assigns every task in the group and preserves manual assignments", () => {
    assert.deepEqual(
      combineTaskAssignments([{ memberId: 2, taskId: 10 }], [group], members, day(0)),
      [
        { memberId: 1, taskId: 10, isManual: false, group: { id: 1, name: "Köket" } },
        { memberId: 2, taskId: 10, isManual: true, group: null },
        { memberId: 1, taskId: 11, isManual: false, group: { id: 1, name: "Köket" } },
      ],
    );
  });

  it("merges a manual and group assignment for the same member and task", () => {
    const result = combineTaskAssignments(
      [{ memberId: 1, taskId: 10 }], [group], members, day(0),
    );
    assert.equal(result.length, 2);
    assert.deepEqual(result[0], {
      memberId: 1, taskId: 10, isManual: true, group: { id: 1, name: "Köket" },
    });
    const withoutManual = combineTaskAssignments([], [group], members, day(0));
    assert.equal(withoutManual[0].isManual, false);
    assert.deepEqual(withoutManual[0].group, { id: 1, name: "Köket" });
  });

  it("keeps manual assignments for paused members and moves only the group", () => {
    const pausedMembers = members.map((member) => ({
      ...member, isPaused: member.id === 1,
    }));
    const result = combineTaskAssignments(
      [{ memberId: 1, taskId: 10 }], [group], pausedMembers, day(0),
    );
    assert.deepEqual(result[0], {
      memberId: 1, taskId: 10, isManual: true, group: null,
    });
    assert.equal(result[1].memberId, 2);
    assert.equal(result[1].group?.id, 1);
  });

  it("rotates the group without changing a manual assignment", () => {
    const result = combineTaskAssignments(
      [{ memberId: 1, taskId: 10 }], [group], members, day(2),
    );
    assert.deepEqual(result, [
      { memberId: 1, taskId: 10, isManual: true, group: null },
      { memberId: 2, taskId: 10, isManual: false, group: { id: 1, name: "Köket" } },
      { memberId: 2, taskId: 11, isManual: false, group: { id: 1, name: "Köket" } },
    ]);
  });
});
