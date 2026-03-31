import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../trpc";

async function getAdventureAndCheckAccess(db: any, adventureId: string, userId: string) {
  const adventure = await db.adventure.findUnique({ where: { id: adventureId } });
  if (!adventure) throw new TRPCError({ code: "NOT_FOUND", message: "Adventure not found" });
  return { adventure, isOwner: adventure.userId === userId };
}

export const saveEncounterAsTemplate = protectedProcedure
  .input(
    z.object({
      adventureId: z.string(),
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { adventure, isOwner } = await getAdventureAndCheckAccess(ctx.db, input.adventureId, ctx.user.userId);
    if (!isOwner) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only the DM can save encounters as templates" });
    }

    const encounter = await ctx.db.encounter.findUnique({
      where: { adventureId: input.adventureId },
      include: {
        participants: {
          where: { type: "MONSTER" },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    if (!encounter) {
      throw new TRPCError({ code: "NOT_FOUND", message: "No encounter found" });
    }

    if (encounter.participants.length === 0) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Encounter has no monster participants to save" });
    }

    return ctx.db.encounterTemplate.create({
      data: {
        userId: ctx.user.userId,
        name: input.name,
        description: input.description,
        participants: {
          create: encounter.participants.map((p: any, index: number) => ({
            name: p.name,
            monsterSource: p.monsterSource ?? "",
            maxHp: p.maxHp ?? 1,
            armorClass: p.armorClass ?? 0,
            initiativeModifier: null,
            sortOrder: index,
          })),
        },
      },
      include: { participants: { orderBy: { sortOrder: "asc" } } },
    });
  });

export const createEncounterTemplate = protectedProcedure
  .input(
    z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      participants: z.array(
        z.object({
          name: z.string().min(1),
          monsterSource: z.string(),
          maxHp: z.number().int().min(1),
          armorClass: z.number().int().min(0),
          initiativeModifier: z.number().int().optional(),
          sortOrder: z.number().int().optional(),
        }),
      ),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "DUNGEON_MASTER" && ctx.user.role !== "ADMIN") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only Dungeon Masters and Admins can create encounter templates" });
    }

    return ctx.db.encounterTemplate.create({
      data: {
        userId: ctx.user.userId,
        name: input.name,
        description: input.description,
        participants: {
          create: input.participants.map((p, index) => ({
            name: p.name,
            monsterSource: p.monsterSource,
            maxHp: p.maxHp,
            armorClass: p.armorClass,
            initiativeModifier: p.initiativeModifier ?? null,
            sortOrder: p.sortOrder ?? index,
          })),
        },
      },
      include: { participants: { orderBy: { sortOrder: "asc" } } },
    });
  });

export const listEncounterTemplates = protectedProcedure
  .query(async ({ ctx }) => {
    return ctx.db.encounterTemplate.findMany({
      where: { userId: ctx.user.userId },
      orderBy: { createdAt: "desc" },
      include: {
        participants: { orderBy: { sortOrder: "asc" } },
        _count: { select: { participants: true } },
      },
    });
  });

export const getEncounterTemplate = protectedProcedure
  .input(z.object({ templateId: z.string() }))
  .query(async ({ ctx, input }) => {
    const template = await ctx.db.encounterTemplate.findUnique({
      where: { id: input.templateId },
      include: { participants: { orderBy: { sortOrder: "asc" } } },
    });
    if (!template) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Encounter template not found" });
    }
    if (template.userId !== ctx.user.userId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this template" });
    }
    return template;
  });

export const deleteEncounterTemplate = protectedProcedure
  .input(z.object({ templateId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const template = await ctx.db.encounterTemplate.findUnique({
      where: { id: input.templateId },
    });
    if (!template) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Encounter template not found" });
    }
    if (template.userId !== ctx.user.userId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this template" });
    }

    await ctx.db.encounterTemplate.delete({ where: { id: input.templateId } });

    return { success: true };
  });

export const createEncounterFromTemplate = protectedProcedure
  .input(
    z.object({
      adventureId: z.string(),
      templateId: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { adventure, isOwner } = await getAdventureAndCheckAccess(ctx.db, input.adventureId, ctx.user.userId);
    if (!isOwner) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only the DM can create encounters" });
    }

    const existing = await ctx.db.encounter.findUnique({
      where: { adventureId: input.adventureId },
    });
    if (existing) {
      throw new TRPCError({ code: "CONFLICT", message: "An encounter already exists for this adventure" });
    }

    const template = await ctx.db.encounterTemplate.findUnique({
      where: { id: input.templateId },
      include: { participants: { orderBy: { sortOrder: "asc" } } },
    });
    if (!template) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Encounter template not found" });
    }

    return ctx.db.encounter.create({
      data: {
        adventureId: input.adventureId,
        participants: {
          create: template.participants.map((p: any) => ({
            type: "MONSTER",
            name: p.name,
            monsterSource: p.monsterSource,
            maxHp: p.maxHp,
            currentHp: p.maxHp,
            armorClass: p.armorClass,
            initiativeRoll: 0,
            sortOrder: p.sortOrder,
          })),
        },
      },
      include: {
        participants: {
          orderBy: [{ initiativeRoll: "desc" }, { sortOrder: "asc" }],
        },
      },
    });
  });
