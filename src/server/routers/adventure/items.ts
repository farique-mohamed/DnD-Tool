import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../trpc";

export const addItem = protectedProcedure
  .input(
    z.object({
      adventureId: z.string(),
      name: z.string().min(1),
      source: z.string().min(1),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    if (
      ctx.user.role !== "DUNGEON_MASTER" &&
      ctx.user.role !== "ADMIN"
    ) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only Dungeon Masters can add items",
      });
    }

    const adventure = await ctx.db.adventure.findUnique({
      where: { id: input.adventureId },
    });
    if (!adventure || adventure.userId !== ctx.user.userId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Adventure not found",
      });
    }

    const item = await ctx.db.adventureItem.create({
      data: {
        adventureId: input.adventureId,
        name: input.name,
        source: input.source,
      },
    });
    return item;
  });

export const removeItem = protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const item = await ctx.db.adventureItem.findUnique({
      where: { id: input.id },
      include: { adventure: true },
    });
    if (!item || item.adventure.userId !== ctx.user.userId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Item not found",
      });
    }

    await ctx.db.adventureItem.delete({
      where: { id: input.id },
    });
    return { success: true };
  });
