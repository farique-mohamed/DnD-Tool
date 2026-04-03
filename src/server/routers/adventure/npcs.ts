import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../trpc";

const npcFields = {
  name: z.string().min(1).max(200),
  race: z.string().min(1).max(100),
  gender: z.string().min(1).max(50),
  alignment: z.string().min(1).max(50),
  occupation: z.string().min(1).max(200),
  personalityTraits: z.string().default("[]"),
  appearance: z.string().max(1000).default(""),
  voiceMannerism: z.string().max(500).default(""),
  background: z.string().max(2000).default(""),
  motivation: z.string().max(1000).default(""),
  secret: z.string().max(2000).default(""),
  notes: z.string().max(5000).default(""),
  location: z.string().max(500).default(""),
  isVisible: z.boolean().default(false),
};

export const addNpc = protectedProcedure
  .input(
    z.object({
      adventureId: z.string(),
      ...npcFields,
    }),
  )
  .mutation(async ({ ctx, input }) => {
    if (
      ctx.user.role !== "DUNGEON_MASTER" &&
      ctx.user.role !== "ADMIN"
    ) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only Dungeon Masters can add NPCs",
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

    const npc = await ctx.db.adventureNpc.create({
      data: {
        adventureId: input.adventureId,
        name: input.name,
        race: input.race,
        gender: input.gender,
        alignment: input.alignment,
        occupation: input.occupation,
        personalityTraits: input.personalityTraits,
        appearance: input.appearance,
        voiceMannerism: input.voiceMannerism,
        background: input.background,
        motivation: input.motivation,
        secret: input.secret,
        notes: input.notes,
        location: input.location,
        isVisible: input.isVisible,
      },
    });
    return npc;
  });

export const updateNpc = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      name: z.string().min(1).max(200).optional(),
      race: z.string().min(1).max(100).optional(),
      gender: z.string().min(1).max(50).optional(),
      alignment: z.string().min(1).max(50).optional(),
      occupation: z.string().min(1).max(200).optional(),
      personalityTraits: z.string().optional(),
      appearance: z.string().max(1000).optional(),
      voiceMannerism: z.string().max(500).optional(),
      background: z.string().max(2000).optional(),
      motivation: z.string().max(1000).optional(),
      secret: z.string().max(2000).optional(),
      notes: z.string().max(5000).optional(),
      location: z.string().max(500).optional(),
      isVisible: z.boolean().optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const npc = await ctx.db.adventureNpc.findUnique({
      where: { id: input.id },
      include: { adventure: true },
    });
    if (!npc || npc.adventure.userId !== ctx.user.userId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "NPC not found",
      });
    }

    const { id, ...data } = input;
    const updated = await ctx.db.adventureNpc.update({
      where: { id },
      data,
    });
    return updated;
  });

export const removeNpc = protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const npc = await ctx.db.adventureNpc.findUnique({
      where: { id: input.id },
      include: { adventure: true },
    });
    if (!npc || npc.adventure.userId !== ctx.user.userId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "NPC not found",
      });
    }

    await ctx.db.adventureNpc.delete({
      where: { id: input.id },
    });
    return { success: true };
  });

export const getNpcs = protectedProcedure
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

    const npcs = await ctx.db.adventureNpc.findMany({
      where: {
        adventureId: input.adventureId,
        ...(isOwner ? {} : { isVisible: true }),
      },
      orderBy: { createdAt: "asc" },
    });

    if (!isOwner) {
      return npcs.map((npc) => ({ ...npc, secret: "" }));
    }

    return npcs;
  });

export const toggleNpcVisibility = protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const npc = await ctx.db.adventureNpc.findUnique({
      where: { id: input.id },
      include: { adventure: true },
    });
    if (!npc || npc.adventure.userId !== ctx.user.userId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "NPC not found",
      });
    }

    const updated = await ctx.db.adventureNpc.update({
      where: { id: input.id },
      data: { isVisible: !npc.isVisible },
    });
    return updated;
  });
