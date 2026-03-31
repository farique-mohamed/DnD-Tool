import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../trpc";

export const getInviteCode = protectedProcedure
  .input(z.object({ adventureId: z.string() }))
  .query(async ({ ctx, input }) => {
    const adventure = await ctx.db.adventure.findUnique({
      where: { id: input.adventureId },
    });
    if (!adventure) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Adventure not found",
      });
    }
    if (adventure.userId !== ctx.user.userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only the DM can view the invite code",
      });
    }
    return { inviteCode: adventure.inviteCode };
  });

export const joinByCode = protectedProcedure
  .input(z.object({ inviteCode: z.string(), characterId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const adventure = await ctx.db.adventure.findUnique({
      where: { inviteCode: input.inviteCode },
    });
    if (!adventure) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Adventure not found",
      });
    }
    if (adventure.userId === ctx.user.userId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You cannot join your own adventure",
      });
    }

    const character = await ctx.db.character.findUnique({
      where: { id: input.characterId },
    });
    if (!character || character.userId !== ctx.user.userId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Character not found or does not belong to you",
      });
    }

    // Check if character is already in an adventure
    const existingAdventure = await ctx.db.adventurePlayer.findFirst({
      where: {
        characterId: input.characterId,
        status: { in: ["PENDING", "ACCEPTED"] },
      },
    });
    if (existingAdventure) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This character is already in an adventure",
      });
    }

    const existingPlayer = await ctx.db.adventurePlayer.findUnique({
      where: {
        adventureId_userId: {
          adventureId: adventure.id,
          userId: ctx.user.userId,
        },
      },
    });

    if (existingPlayer) {
      if (existingPlayer.status === "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Already requested to join",
        });
      }
      if (existingPlayer.status === "ACCEPTED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Already a member",
        });
      }
      if (existingPlayer.status === "REJECTED") {
        await ctx.db.adventurePlayer.update({
          where: { id: existingPlayer.id },
          data: { status: "PENDING", resolvedAt: null, characterId: input.characterId },
        });
        return { success: true, adventureName: adventure.name };
      }
    }

    await ctx.db.adventurePlayer.create({
      data: {
        adventureId: adventure.id,
        userId: ctx.user.userId,
        characterId: input.characterId,
        status: "PENDING",
      },
    });

    return { success: true, adventureName: adventure.name };
  });

export const getPendingPlayers = protectedProcedure
  .input(z.object({ adventureId: z.string() }))
  .query(async ({ ctx, input }) => {
    const adventure = await ctx.db.adventure.findUnique({
      where: { id: input.adventureId },
    });
    if (!adventure) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Adventure not found",
      });
    }
    if (adventure.userId !== ctx.user.userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only the DM can view pending players",
      });
    }

    return ctx.db.adventurePlayer.findMany({
      where: {
        adventureId: input.adventureId,
        status: "PENDING",
      },
      include: {
        user: { select: { id: true, username: true } },
        character: true,
      },
      orderBy: { joinedAt: "asc" },
    });
  });

export const resolvePlayer = protectedProcedure
  .input(
    z.object({
      adventurePlayerId: z.string(),
      action: z.enum(["ACCEPTED", "REJECTED"]),
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
        message: "Player request not found",
      });
    }
    if (adventurePlayer.adventure.userId !== ctx.user.userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only the DM can resolve player requests",
      });
    }

    return ctx.db.adventurePlayer.update({
      where: { id: input.adventurePlayerId },
      data: {
        status: input.action,
        resolvedAt: new Date(),
      },
    });
  });

export const getAcceptedPlayers = protectedProcedure
  .input(z.object({ adventureId: z.string() }))
  .query(async ({ ctx, input }) => {
    const adventure = await ctx.db.adventure.findUnique({
      where: { id: input.adventureId },
    });
    if (!adventure) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Adventure not found",
      });
    }
    if (adventure.userId !== ctx.user.userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only the DM can view accepted players",
      });
    }

    return ctx.db.adventurePlayer.findMany({
      where: {
        adventureId: input.adventureId,
        status: "ACCEPTED",
      },
      include: {
        user: { select: { id: true, username: true } },
        character: true,
      },
    });
  });

export const updatePlayerConditions = protectedProcedure
  .input(
    z.object({
      adventureId: z.string(),
      characterId: z.string(),
      activeConditions: z.array(z.string()),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const adventure = await ctx.db.adventure.findUnique({
      where: { id: input.adventureId },
    });
    if (!adventure) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Adventure not found",
      });
    }
    if (adventure.userId !== ctx.user.userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only the DM can update player conditions",
      });
    }

    // Verify the character belongs to an accepted player in this adventure
    const adventurePlayer = await ctx.db.adventurePlayer.findFirst({
      where: {
        adventureId: input.adventureId,
        characterId: input.characterId,
        status: "ACCEPTED",
      },
    });
    if (!adventurePlayer) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Character is not an accepted player in this adventure",
      });
    }

    return ctx.db.character.update({
      where: { id: input.characterId },
      data: { activeConditions: JSON.stringify(input.activeConditions) },
    });
  });
