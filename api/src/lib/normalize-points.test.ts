import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { activeRatio, normalizePoints } from "./normalize-points.ts";

const DAY = 24 * 60 * 60 * 1000;
const from = new Date("2026-10-12T00:00:00Z");
const to = new Date("2026-10-19T00:00:00Z");
const afterPeriod = new Date("2026-10-20T00:00:00Z");
const day = (n: number) => new Date(from.getTime() + n * DAY);

const assertClose = (actual: number, expected: number) =>
  assert.ok(
    Math.abs(actual - expected) < 1e-9,
    `expected ${actual} to be close to ${expected}`,
  );

describe("activeRatio", () => {
  it("is 1 without pauses", () => {
    assert.equal(activeRatio([], from, to, afterPeriod), 1);
  });

  it("is 0.5 when paused half the week", () => {
    const pauses = [{ startDate: day(3.5), endDate: to }];
    assertClose(activeRatio(pauses, from, to, afterPeriod), 0.5);
  });

  it("is 0 when paused the whole period", () => {
    const pauses = [{ startDate: day(-2), endDate: null }];
    assert.equal(activeRatio(pauses, from, to, afterPeriod), 0);
  });

  it("counts overlapping pauses once", () => {
    const pauses = [
      { startDate: day(1), endDate: day(3) },
      { startDate: day(2), endDate: day(4) },
    ];
    assertClose(activeRatio(pauses, from, to, afterPeriod), 4 / 7);
  });

  it("treats a pause without end as ongoing", () => {
    const pauses = [{ startDate: day(5), endDate: null }];
    assertClose(activeRatio(pauses, from, to, afterPeriod), 5 / 7);
  });

  it("caps an ongoing period at now", () => {
    const pauses = [{ startDate: day(0), endDate: day(1) }];
    assertClose(activeRatio(pauses, from, to, day(3)), 2 / 3);
  });
});

describe("normalizePoints", () => {
  it("doubles points for a member paused half the period", () => {
    assert.equal(normalizePoints(6, 0.5), 12);
  });

  it("keeps raw points when the member was never active", () => {
    assert.equal(normalizePoints(4, 0), 4);
  });
});
