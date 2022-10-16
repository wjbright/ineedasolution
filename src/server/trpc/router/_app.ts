// src/server/trpc/router/_app.ts
import { router } from "../trpc";
import { browserRouter } from "./browser";
import { authRouter } from "./auth";

export const appRouter = router({
  browser: browserRouter,
  auth: authRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
