import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, mergeRouters, protectedProcedure } from "../trpc";
import { characterImportExportRouter } from "./characterImportExport";
import { ALIGNMENTS, abilityScore } from "./characterConstants";

const baseCharacterRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        race: z.string().min(1),
        characterClass: z.string().min(1),
        rulesSource: z.enum(["PHB", "XPHB"]).default("PHB"),
        level: z.literal(1).default(1),
        alignment: z.enum(ALIGNMENTS).default("True Neutral"),
        background: z.string().optional(),
        backstory: z.string().optional(),
        languages: z.string().optional(),
        skillProficiencies: z.string().optional(),
        skillExpertise: z.string().optional(),
        strength: abilityScore.default(10),
        dexterity: abilityScore.default(10),
        constitution: abilityScore.default(10),
        intelligence: abilityScore.default(10),
        wisdom: abilityScore.default(10),
        charisma: abilityScore.default(10),
        maxHp: z.number().int().min(1).default(10),
        armorClass: z.number().int().min(1).default(10),
        speed: z.number().int().min(0).default(30),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.create({
        data: {
          ...input,
          userId: ctx.user.userId,
          currentHp: input.maxHp,
        },
      });
      return character;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100),
        race: z.string().min(1),
        characterClass: z.string().min(1),
        rulesSource: z.enum(["PHB", "XPHB"]).optional(),
        alignment: z.enum(ALIGNMENTS).optional(),
        background: z.string().optional(),
        backstory: z.string().optional(),
        languages: z.string().optional(),
        skillProficiencies: z.string().optional(),
        skillExpertise: z.string().optional(),
        strength: abilityScore,
        dexterity: abilityScore,
        constitution: abilityScore,
        intelligence: abilityScore,
        wisdom: abilityScore,
        charisma: abilityScore,
        maxHp: z.number().int().min(1),
        armorClass: z.number().int().min(1),
        speed: z.number().int().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findFirst({
        where: { id: input.id, userId: ctx.user.userId },
      });
      if (!character) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Character not found",
        });
      }

      const { id, ...data } = input;

      // If maxHp changed and currentHp exceeds new maxHp, clamp it
      const currentHpUpdate =
        character.currentHp > input.maxHp
          ? { currentHp: input.maxHp }
          : {};

      return ctx.db.character.update({
        where: { id: input.id },
        data: {
          ...data,
          ...currentHpUpdate,
        },
      });
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.character.findMany({
      where: { userId: ctx.user.userId },
      orderBy: { createdAt: "desc" },
      include: {
        adventurePlayers: {
          where: { status: { in: ["PENDING", "ACCEPTED"] } },
          include: {
            adventure: { select: { id: true, name: true, source: true } },
          },
          take: 1,
        },
      },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const character = await ctx.db.character.findFirst({
        where: { id: input.id, userId: ctx.user.userId },
        include: {
          adventurePlayers: {
            where: { status: { in: ["PENDING", "ACCEPTED"] } },
            include: {
              adventure: { select: { id: true, name: true, source: true } },
            },
            take: 1,
          },
        },
      });
      if (!character) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Character not found",
        });
      }
      return character;
    }),

  updateHp: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        type: z.enum(["heal", "damage", "setTempHp"]),
        amount: z.number().int().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findFirst({
        where: { id: input.id, userId: ctx.user.userId },
      });
      if (!character) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Character not found",
        });
      }

      let { currentHp, tempHp } = character;

      if (input.type === "heal") {
        // Healing adds to currentHp, capped at maxHp. Does not affect tempHp.
        currentHp = Math.min(character.maxHp, currentHp + input.amount);
      } else if (input.type === "damage") {
        // Damage absorbs tempHp first, then reduces currentHp. Both floor at 0.
        const remainingDamage = Math.max(0, input.amount - tempHp);
        tempHp = Math.max(0, tempHp - input.amount);
        currentHp = Math.max(0, currentHp - remainingDamage);
      } else if (input.type === "setTempHp") {
        // Temp HP replaces (D&D 5e rule: take higher, but we allow direct set here)
        tempHp = input.amount;
      }

      return ctx.db.character.update({
        where: { id: input.id },
        data: { currentHp, tempHp },
      });
    }),

  levelUp: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        newMaxHp: z.number().int().min(1), // player confirms new max HP
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findFirst({
        where: { id: input.id, userId: ctx.user.userId },
      });
      if (!character) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Character not found",
        });
      }
      if (character.level >= 20) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Already at max level",
        });
      }
      // Reset spell slots and feature uses on level up
      return ctx.db.character.update({
        where: { id: input.id },
        data: {
          level: character.level + 1,
          maxHp: input.newMaxHp,
          currentHp: input.newMaxHp, // full HP on level up
          spellSlotsUsed: "[]",
          featureUses: "{}",
        },
      });
    }),

  updateSpellSlots: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        spellSlotsUsed: z.array(z.number().int().min(0)).length(9),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findFirst({
        where: { id: input.id, userId: ctx.user.userId },
      });
      if (!character) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Character not found",
        });
      }
      return ctx.db.character.update({
        where: { id: input.id },
        data: { spellSlotsUsed: JSON.stringify(input.spellSlotsUsed) },
      });
    }),

  updateSubclass: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        subclass: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findFirst({
        where: { id: input.id, userId: ctx.user.userId },
      });
      if (!character) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Character not found",
        });
      }
      return ctx.db.character.update({
        where: { id: input.id },
        data: { subclass: input.subclass },
      });
    }),

  longRest: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findFirst({
        where: { id: input.id, userId: ctx.user.userId },
      });
      if (!character)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Character not found",
        });

      // Parse existing featureUses, reset long-rest ones to 0
      let featureUses: Record<string, number> = {};
      try {
        featureUses = JSON.parse(character.featureUses || "{}") as Record<
          string,
          number
        >;
      } catch {
        /* empty */
      }

      const LONG_REST_FEATURES = [
        "Rage",
        "Second Wind",
        "Action Surge",
        "Indomitable",
        "Channel Divinity",
        "Wild Shape",
        "Lay on Hands",
        "Divine Sense",
        "Bardic Inspiration",
        "Arcane Recovery",
        "Countercharm",
        "Flurry of Blows",
        "Patient Defense",
        "Step of the Wind",
        "Psionic Power",
      ];
      for (const f of LONG_REST_FEATURES) {
        if (f in featureUses) featureUses[f] = 0;
      }

      return ctx.db.character.update({
        where: { id: input.id },
        data: {
          currentHp: character.maxHp,
          tempHp: 0,
          spellSlotsUsed: "[]",
          featureUses: JSON.stringify(featureUses),
        },
      });
    }),

  shortRest: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        hpRecovered: z.number().int().min(0), // result of hit dice rolled by player
        isWarlock: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findFirst({
        where: { id: input.id, userId: ctx.user.userId },
      });
      if (!character)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Character not found",
        });

      let featureUses: Record<string, number> = {};
      try {
        featureUses = JSON.parse(character.featureUses || "{}") as Record<
          string,
          number
        >;
      } catch {
        /* empty */
      }

      const SHORT_REST_FEATURES = [
        "Second Wind",
        "Action Surge",
        "Flurry of Blows",
        "Patient Defense",
        "Step of the Wind",
      ];
      for (const f of SHORT_REST_FEATURES) {
        if (f in featureUses) featureUses[f] = 0;
      }

      const newHp = Math.min(
        character.maxHp,
        character.currentHp + input.hpRecovered,
      );

      return ctx.db.character.update({
        where: { id: input.id },
        data: {
          currentHp: newHp,
          ...(input.isWarlock ? { spellSlotsUsed: "[]" } : {}),
          featureUses: JSON.stringify(featureUses),
        },
      });
    }),

  updateSkillProficiencies: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        skillProficiencies: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findFirst({
        where: { id: input.id, userId: ctx.user.userId },
      });
      if (!character)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Character not found",
        });
      return ctx.db.character.update({
        where: { id: input.id },
        data: { skillProficiencies: JSON.stringify(input.skillProficiencies) },
      });
    }),

  updateSkillExpertise: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        skillExpertise: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findFirst({
        where: { id: input.id, userId: ctx.user.userId },
      });
      if (!character) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Character not found",
        });
      }
      return ctx.db.character.update({
        where: { id: input.id },
        data: { skillExpertise: JSON.stringify(input.skillExpertise) },
      });
    }),

  updatePreparedSpells: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        preparedSpells: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findFirst({
        where: { id: input.id, userId: ctx.user.userId },
      });
      if (!character)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Character not found",
        });
      return ctx.db.character.update({
        where: { id: input.id },
        data: { preparedSpells: JSON.stringify(input.preparedSpells) },
      });
    }),

  updateFeatureUses: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        featureUses: z.record(z.string(), z.number().int().min(0)),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findFirst({
        where: { id: input.id, userId: ctx.user.userId },
      });
      if (!character)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Character not found",
        });
      return ctx.db.character.update({
        where: { id: input.id },
        data: { featureUses: JSON.stringify(input.featureUses) },
      });
    }),

  updateAbilityScores: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        strength: z.number().int().min(1).max(30),
        dexterity: z.number().int().min(1).max(30),
        constitution: z.number().int().min(1).max(30),
        intelligence: z.number().int().min(1).max(30),
        wisdom: z.number().int().min(1).max(30),
        charisma: z.number().int().min(1).max(30),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findFirst({
        where: { id: input.id, userId: ctx.user.userId },
      });
      if (!character) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Character not found",
        });
      }
      return ctx.db.character.update({
        where: { id: input.id },
        data: {
          strength: input.strength,
          dexterity: input.dexterity,
          constitution: input.constitution,
          intelligence: input.intelligence,
          wisdom: input.wisdom,
          charisma: input.charisma,
        },
      });
    }),

  updateActiveConditions: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        activeConditions: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findFirst({
        where: { id: input.id, userId: ctx.user.userId },
      });
      if (!character) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Character not found",
        });
      }
      return ctx.db.character.update({
        where: { id: input.id },
        data: { activeConditions: JSON.stringify(input.activeConditions) },
      });
    }),

  updateActiveDiseases: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        activeDiseases: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findFirst({
        where: { id: input.id, userId: ctx.user.userId },
      });
      if (!character) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Character not found",
        });
      }
      return ctx.db.character.update({
        where: { id: input.id },
        data: { activeDiseases: JSON.stringify(input.activeDiseases) },
      });
    }),

  updateFeats: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        feats: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findFirst({
        where: { id: input.id, userId: ctx.user.userId },
      });
      if (!character) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Character not found",
        });
      }
      return ctx.db.character.update({
        where: { id: input.id },
        data: { feats: JSON.stringify(input.feats) },
      });
    }),

  updateLanguages: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        languages: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findFirst({
        where: { id: input.id, userId: ctx.user.userId },
      });
      if (!character)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Character not found",
        });
      return ctx.db.character.update({
        where: { id: input.id },
        data: { languages: JSON.stringify(input.languages) },
      });
    }),

  updateLevelUpSelections: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        levelUpSelections: z.record(z.string(), z.array(z.string())),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findFirst({
        where: { id: input.id, userId: ctx.user.userId },
      });
      if (!character)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Character not found",
        });
      return ctx.db.character.update({
        where: { id: input.id },
        data: {
          levelUpSelections: JSON.stringify(input.levelUpSelections),
        },
      });
    }),

  updateNotes: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        notes: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const character = await ctx.db.character.findFirst({
        where: { id: input.id, userId: ctx.user.userId },
      });
      if (!character) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Character not found",
        });
      }
      return ctx.db.character.update({
        where: { id: input.id },
        data: { notes: input.notes },
      });
    }),
});

export const characterRouter = mergeRouters(
  baseCharacterRouter,
  characterImportExportRouter,
);
