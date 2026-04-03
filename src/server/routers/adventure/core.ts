import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../trpc";
import { extractAdventureReferences } from "@/lib/adventureExtractor";

export const create = protectedProcedure
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
  });

export const list = protectedProcedure.query(async ({ ctx }) => {
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
});

export const getById = protectedProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ ctx, input }) => {
    const adventure = await ctx.db.adventure.findUnique({
      where: { id: input.id },
      include: {
        monsters: { orderBy: { createdAt: "asc" } },
        items: { orderBy: { createdAt: "asc" } },
        spells: { orderBy: { createdAt: "asc" } },
        npcs: { orderBy: { createdAt: "asc" } },
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
  });
