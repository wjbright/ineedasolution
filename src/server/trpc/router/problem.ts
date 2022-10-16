import { router, publicProcedure } from "../trpc";
import { z } from "zod";

export const problemRouter = router({
  get: publicProcedure
    .query(async ({ ctx }) => {
      return (await ctx.prisma.problem.findMany()).reverse();
    }),
  add: publicProcedure
    .input(z.object({ signature: z.string(), problem: z.string() }))
    .mutation( async ({ ctx, input }) => {
      return await ctx.prisma.problem.create({data: {
        description: input.problem,
        browserId: input.signature
      }})
    }),
});
