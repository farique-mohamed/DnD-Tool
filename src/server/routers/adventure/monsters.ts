import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../trpc";

export const addMonster = protectedProcedure
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
        message: "Only Dungeon Masters can add monsters",
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

    const monster = await ctx.db.adventureMonster.create({
      data: {
        adventureId: input.adventureId,
        name: input.name,
        source: input.source,
      },
    });
    return monster;
  });

export const removeMonster = protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const monster = await ctx.db.adventureMonster.findUnique({
      where: { id: input.id },
      include: { adventure: true },
    });
    if (!monster || monster.adventure.userId !== ctx.user.userId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Monster not found",
      });
    }

    await ctx.db.adventureMonster.delete({
      where: { id: input.id },
    });
    return { success: true };
  });
