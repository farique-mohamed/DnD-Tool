import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/trpc";

export const itemsRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        isMagical: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.item.findMany({
        where:
          input?.isMagical !== undefined
            ? { isMagical: input.isMagical }
            : undefined,
        orderBy: { name: "asc" },
      });

      return items;
    }),
});
