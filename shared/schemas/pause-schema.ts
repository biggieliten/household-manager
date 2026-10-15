import z from "zod";

export const createPauseSchema = z.object({
  memberId: z.int().nonnegative(),
});

export const responsePauseSchema = createPauseSchema.extend({
  id: z.int(),
  startDate: z.date(),
  endDate: z.date().nullable(),
  createdAt: z.date(),
});

export type Pause = z.infer<typeof responsePauseSchema>;
export type CreatePauseInput = z.input<typeof createPauseSchema>;
