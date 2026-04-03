import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../trpc";

export const getFamiliars = protectedProcedure
  .input(
    z.object({
      adventurePlayerId: z.string(),
    }),
  )
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
        message: "You do not have access to this player's familiars",
      });
    }

    return ctx.db.adventurePlayerFamiliar.findMany({
      where: { adventurePlayerId: input.adventurePlayerId },
      include: {
        assignedByUser: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  });

export const addFamiliar = protectedProcedure
  .input(
    z.object({
      adventurePlayerId: z.string(),
      monsterName: z.string().min(1),
      displayName: z.string().min(1),
      monsterSource: z.string().min(1),
      notes: z.string().optional(),
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
        message: "Only the DM can add familiars",
      });
    }

    return ctx.db.adventurePlayerFamiliar.create({
      data: {
        adventurePlayerId: input.adventurePlayerId,
        monsterName: input.monsterName,
        displayName: input.displayName,
        monsterSource: input.monsterSource,
        notes: input.notes ?? "",
        assignedByUserId: ctx.user.userId,
      },
      include: {
        assignedByUser: { select: { id: true, username: true } },
      },
    });
  });

export const removeFamiliar = protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const familiar = await ctx.db.adventurePlayerFamiliar.findUnique({
      where: { id: input.id },
      include: {
        adventurePlayer: {
          include: { adventure: true },
        },
      },
    });
    if (!familiar) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Familiar not found",
      });
    }
    if (familiar.adventurePlayer.adventure.userId !== ctx.user.userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only the DM can remove familiars",
      });
    }

    await ctx.db.adventurePlayerFamiliar.delete({
      where: { id: input.id },
    });
    return { success: true };
  });

export const updateFamiliar = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      displayName: z.string().min(1).optional(),
      notes: z.string().optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const familiar = await ctx.db.adventurePlayerFamiliar.findUnique({
      where: { id: input.id },
      include: {
        adventurePlayer: {
          include: { adventure: true },
        },
      },
    });
    if (!familiar) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Familiar not found",
      });
    }
    if (familiar.adventurePlayer.adventure.userId !== ctx.user.userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only the DM can update familiars",
      });
    }

    const data: { displayName?: string; notes?: string } = {};
    if (input.displayName !== undefined) data.displayName = input.displayName;
    if (input.notes !== undefined) data.notes = input.notes;

    return ctx.db.adventurePlayerFamiliar.update({
      where: { id: input.id },
      data,
      include: {
        assignedByUser: { select: { id: true, username: true } },
      },
    });
  });
