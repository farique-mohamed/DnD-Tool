import { createTRPCRouter, publicProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  /**
   * Scaffold for a future Dungeon Master role request flow.
   * TODO: Implement the actual approval process once the admin
   * review workflow is designed. For now this is a stub that
   * signals intent and can be wired to the UI immediately.
   */
  requestDungeonMaster: publicProcedure.mutation(async () => {
    return {
      success: true,
      message: "Request submitted",
    };
  }),
});
