import { createTRPCRouter } from "../trpc";
import { authRouter } from "./auth";
import { userRouter } from "./user";
import { adminRouter } from "./admin";
import { diceRouter } from "./dice";
import { itemsRouter } from "./items";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  admin: adminRouter,
  dice: diceRouter,
  items: itemsRouter,
});

export type AppRouter = typeof appRouter;
