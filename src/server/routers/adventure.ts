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
      where: { userId: ctx.user.userId },
      orderBy: { createdAt: "desc" },
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
        },
      });
      if (!adventure || adventure.userId !== ctx.user.userId) {
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
});
