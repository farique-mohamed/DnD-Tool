import { createTRPCRouter } from "../trpc";
import { authRouter } from "./auth";
import { userRouter } from "./user";
import { adminRouter } from "./admin";
import { diceRouter } from "./dice";
import { itemsRouter } from "./items";
import { characterRouter } from "./character";
import { adventureRouter } from "./adventure";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  admin: adminRouter,
  dice: diceRouter,
  items: itemsRouter,
  character: characterRouter,
  adventure: adventureRouter,
});

export type AppRouter = typeof appRouter;
