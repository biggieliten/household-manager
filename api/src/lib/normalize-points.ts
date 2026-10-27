type PauseInterval = { startDate: Date; endDate: Date | null };

// Share of the period (capped at now) the member was not paused, from 0 to 1
export const activeRatio = (
  pauses: PauseInterval[],
  from: Date,
  to: Date,
  now: Date,
) => {
  const start = from.getTime();
  const end = Math.min(to.getTime(), now.getTime());
  if (end <= start) return 1;

  const intervals = pauses
    .map((pause) => ({
      start: Math.max(pause.startDate.getTime(), start),
      end: Math.min(pause.endDate?.getTime() ?? end, end),
    }))
    .filter((interval) => interval.start < interval.end)
    .sort((a, b) => a.start - b.start);

  let pausedTime = 0;
  let coveredUntil = start;
  for (const interval of intervals) {
    const overlapStart = Math.max(interval.start, coveredUntil);
    if (interval.end > overlapStart) {
      pausedTime += interval.end - overlapStart;
      coveredUntil = interval.end;
    }
  }
  return 1 - pausedTime / (end - start);
};

// Points as if the member had been active the whole period
export const normalizePoints = (points: number, ratio: number) =>
  ratio > 0 ? Math.round(points / ratio) : points;
