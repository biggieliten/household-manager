```
npm install
npm run dev
```

```
open http://localhost:3000
```

```
npm test
```

## Statistics normalization

Members paused during part of a statistics period get their points scaled up to a full period:

```
normalized points = points × period length / active time
```

- Active time is the period (capped at now) minus paused time; overlapping pauses count once.
- Normalized points are rounded to whole numbers, and `totalPoints` is their sum.
- Members paused for the whole period keep their raw points.
