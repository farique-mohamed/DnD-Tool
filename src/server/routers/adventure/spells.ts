import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../trpc";

export const addSpell = protectedProcedure
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
        message: "Only Dungeon Masters can add spells",
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

    const spell = await ctx.db.adventureSpell.create({
      data: {
        adventureId: input.adventureId,
        name: input.name,
        source: input.source,
      },
    });
    return spell;
  });

export const removeSpell = protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const spell = await ctx.db.adventureSpell.findUnique({
      where: { id: input.id },
      include: { adventure: true },
    });
    if (!spell || spell.adventure.userId !== ctx.user.userId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Spell not found",
      });
    }

    await ctx.db.adventureSpell.delete({
      where: { id: input.id },
    });
    return { success: true };
  });

export const getSpells = protectedProcedure
  .input(z.object({ adventureId: z.string() }))
  .query(async ({ ctx, input }) => {
    const adventure = await ctx.db.adventure.findUnique({
      where: { id: input.adventureId },
      include: {
        players: {
          where: { userId: ctx.user.userId, status: "ACCEPTED" },
        },
      },
    });
    if (!adventure) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Adventure not found",
      });
    }

    const isOwner = adventure.userId === ctx.user.userId;
    const isPlayer = adventure.players.length > 0;
    if (!isOwner && !isPlayer) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Adventure not found",
      });
    }

    return ctx.db.adventureSpell.findMany({
      where: { adventureId: input.adventureId },
      orderBy: { createdAt: "asc" },
    });
  });

// ── Player-level spell assignments ────────────────────────────────────

export const addPlayerSpell = protectedProcedure
  .input(
    z.object({
      adventurePlayerId: z.string(),
      spellName: z.string().min(1),
      spellSource: z.string().min(1),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const adventurePlayer = await ctx.db.adventurePlayer.findUnique({
      where: { id: input.adventurePlayerId },
      include: { adventure: true },
    });
    if (!adventurePlayer) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Adventure player not found",
      });
    }
    if (adventurePlayer.adventure.userId !== ctx.user.userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only the DM can assign spells to players",
      });
    }

    return ctx.db.adventurePlayerSpell.create({
      data: {
        adventurePlayerId: input.adventurePlayerId,
        spellName: input.spellName,
        spellSource: input.spellSource,
        assignedByUserId: ctx.user.userId,
      },
      include: {
        assignedByUser: { select: { id: true, username: true } },
      },
    });
  });

export const removePlayerSpell = protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const spell = await ctx.db.adventurePlayerSpell.findUnique({
      where: { id: input.id },
      include: {
        adventurePlayer: {
          include: { adventure: true },
        },
      },
    });
    if (!spell) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Player spell not found",
      });
    }
    if (spell.adventurePlayer.adventure.userId !== ctx.user.userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only the DM can remove player spells",
      });
    }

    await ctx.db.adventurePlayerSpell.delete({
      where: { id: input.id },
    });
    return { success: true };
  });

export const getPlayerSpells = protectedProcedure
  .input(z.object({ adventurePlayerId: z.string() }))
  .query(async ({ ctx, input }) => {
    const adventurePlayer = await ctx.db.adventurePlayer.findUnique({
      where: { id: input.adventurePlayerId },
      include: { adventure: true },
    });
    if (!adventurePlayer) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Adventure player not found",
      });
    }

    const isOwner = adventurePlayer.adventure.userId === ctx.user.userId;
    const isPlayer = adventurePlayer.userId === ctx.user.userId;
    if (!isOwner && !isPlayer) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have access to this player's spells",
      });
    }

    return ctx.db.adventurePlayerSpell.findMany({
      where: { adventurePlayerId: input.adventurePlayerId },
      include: {
        assignedByUser: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  });
