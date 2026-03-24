import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { extractAdventureReferences } from "@/lib/adventureExtractor";

export const adventureRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
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
          message: "Only Dungeon Masters can create adventures",
        });
      }

      const adventure = await ctx.db.adventure.create({
        data: {
          userId: ctx.user.userId,
          name: input.name,
          source: input.source,
        },
      });

      const refs = extractAdventureReferences(input.source);

      if (refs.monsters.length > 0) {
        await ctx.db.adventureMonster.createMany({
          data: refs.monsters.map((m) => ({
            adventureId: adventure.id,
            name: m.name,
            source: m.source,
          })),
          skipDuplicates: true,
        });
      }

      if (refs.items.length > 0) {
        await ctx.db.adventureItem.createMany({
          data: refs.items.map((item) => ({
            adventureId: adventure.id,
            name: item.name,
            source: item.source,
          })),
          skipDuplicates: true,
        });
      }

      return ctx.db.adventure.findUnique({
        where: { id: adventure.id },
        include: { monsters: true, items: true },
      });
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.adventure.findMany({
      where: {
        OR: [
          { userId: ctx.user.userId },
          { players: { some: { userId: ctx.user.userId, status: "ACCEPTED" } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, username: true } },
        _count: {
          select: {
            players: { where: { status: "PENDING" } },
          },
        },
      },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const adventure = await ctx.db.adventure.findUnique({
        where: { id: input.id },
        include: {
          monsters: { orderBy: { createdAt: "asc" } },
          items: { orderBy: { createdAt: "asc" } },
          players: {
            include: {
              user: { select: { id: true, username: true } },
              character: true,
            },
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
      const isPlayer = adventure.players?.some(
        (p) => p.userId === ctx.user.userId && p.status === "ACCEPTED",
      );
      if (!isOwner && !isPlayer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Adventure not found",
        });
      }
      return adventure;
    }),

  addMonster: protectedProcedure
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
    }),

  removeMonster: protectedProcedure
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
    }),

  addItem: protectedProcedure
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
    }),

  removeItem: protectedProcedure
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
    }),

  getInviteCode: protectedProcedure
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
    }),

  joinByCode: protectedProcedure
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
    }),

  getPendingPlayers: protectedProcedure
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
    }),

  resolvePlayer: protectedProcedure
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
    }),

  getAcceptedPlayers: protectedProcedure
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
    }),
});
