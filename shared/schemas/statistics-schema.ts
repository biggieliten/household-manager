import z from "zod";

// Query params arrive as ISO strings; `to` is exclusive
export const statisticsPeriodQuerySchema = z
  .object({
    from: z.coerce.date<string>(),
    to: z.coerce.date<string>(),
  })
  .refine(({ from, to }) => from < to, {
    message: "from must be before to",
    path: ["to"],
  });

export type StatisticsPeriodQuery = z.input<typeof statisticsPeriodQuerySchema>;
