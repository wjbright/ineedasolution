// src/server/trpc/router/_app.ts
import { router } from "../trpc";
import { browserRouter } from "./browser";
import { voteRouter } from "./vote";
import { authRouter } from "./auth";
import { problemRouter } from "./problem";

export const appRouter = router({
  browser: browserRouter,
  auth: authRouter,
  vote: voteRouter,
  problem: problemRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
