import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const voteRouter = router({
  get: publicProcedure.query(async ({ ctx }) => {
    return (await ctx.prisma.vote.findMany()).reverse();
  }),
  add: publicProcedure
    .input(z.object({ signature: z.string(), problemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      console.log("🚀 ~ file: vote.ts ~ line 13 ~ .mutation ~ input", input);
      const votedOnProblemBefore = await ctx.prisma.problem.findFirst({
        where: {
          Vote: {
            some: {
              browserSignature: input.signature,
              problemId: input.problemId,
            },
          },
        },
      });

      if (votedOnProblemBefore)
        throw new TRPCError({
          message: "You have voted on this problem before",
          code: "BAD_REQUEST",
        });

      return await ctx.prisma.vote.create({
        data: {
          problemId: input.problemId,
          browserSignature: input.signature,
        },
      });
    }),
  deleteAll: publicProcedure.mutation(async ({ ctx }) => {
    return await ctx.prisma.vote.deleteMany();
  }),
});
