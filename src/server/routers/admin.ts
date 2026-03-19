import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const adminRouter = createTRPCRouter({
  /**
   * Returns all PLAYER-role users as a stub for pending DM requests.
   * TODO: Replace with a dedicated DmRequest model once designed.
   */
  getDmRequests: publicProcedure.query(async ({ ctx }) => {
    const users = await ctx.db.user.findMany({
      where: { role: "PLAYER" },
      select: {
        id: true,
        username: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return users;
  }),

  /**
   * Promotes a user from PLAYER to DUNGEON_MASTER.
   */
  approveDmRequest: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.user.update({
        where: { id: input.userId },
        data: { role: "DUNGEON_MASTER" },
        select: { id: true, username: true, role: true },
      });
      return updated;
    }),
});
