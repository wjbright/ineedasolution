import { router, publicProcedure } from "../trpc";
import { z } from "zod";

export const browserRouter = router({
  get: publicProcedure
    .input(z.object({ signature: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.browser.findFirst({
        where: { signature: input.signature },
      });
    }),
  store: publicProcedure
    .input(z.object({ signature: z.string() }))
    .mutation( async ({ ctx, input }) => {
      const browserExists = await ctx.prisma.browser.findFirst({
        where: { signature: input.signature },
      });

      if (browserExists) return {
        browser: browserExists,
        returning: true,
      }

      const newBrowser = await ctx.prisma.browser.create({
        data: {
          signature: input.signature,
        },
      });

      return {
        browser: newBrowser,
        returning: false,
      }
    }),
});
