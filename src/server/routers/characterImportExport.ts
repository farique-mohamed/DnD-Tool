import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { ALIGNMENTS } from "./characterConstants";

export const characterImportExportRouter = createTRPCRouter({
  export: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const character = await ctx.db.character.findFirst({
        where: { id: input.id, userId: ctx.user.userId },
      });
      if (!character) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Character not found",
        });
      }

      return {
        _version: 1,
        _exportedAt: new Date().toISOString(),
        name: character.name,
        race: character.race,
        characterClass: character.characterClass,
        rulesSource: character.rulesSource,
        level: character.level,
        alignment: character.alignment,
        background: character.background,
        backstory: character.backstory,
        languages: character.languages,
        strength: character.strength,
        dexterity: character.dexterity,
        constitution: character.constitution,
        intelligence: character.intelligence,
        wisdom: character.wisdom,
        charisma: character.charisma,
        maxHp: character.maxHp,
        currentHp: character.currentHp,
        tempHp: character.tempHp,
        armorClass: character.armorClass,
        speed: character.speed,
        subclass: character.subclass,
        spellSlotsUsed: character.spellSlotsUsed,
        skillProficiencies: character.skillProficiencies,
        skillExpertise: character.skillExpertise,
        preparedSpells: character.preparedSpells,
        featureUses: character.featureUses,
        activeConditions: character.activeConditions,
        activeDiseases: character.activeDiseases,
        feats: character.feats,
        notes: character.notes,
        equippedItems: character.equippedItems,
      };
    }),

  import: protectedProcedure
    .input(
      z.object({
        data: z.object({
          _version: z.number().optional(),
          _exportedAt: z.string().optional(),
          name: z.string().min(1).max(100),
          race: z.string().min(1),
          characterClass: z.string().min(1),
          rulesSource: z.enum(["PHB", "XPHB"]).default("PHB"),
          level: z.number().int().min(1).max(20).default(1),
          alignment: z.enum(ALIGNMENTS).default("True Neutral"),
          background: z.string().nullable().optional(),
          backstory: z.string().nullable().optional(),
          languages: z.string().optional().default("[]"),
          strength: z.number().int().min(1).max(30).default(10),
          dexterity: z.number().int().min(1).max(30).default(10),
          constitution: z.number().int().min(1).max(30).default(10),
          intelligence: z.number().int().min(1).max(30).default(10),
          wisdom: z.number().int().min(1).max(30).default(10),
          charisma: z.number().int().min(1).max(30).default(10),
          maxHp: z.number().int().min(1).default(10),
          currentHp: z.number().int().min(0).default(10),
          tempHp: z.number().int().min(0).default(0),
          armorClass: z.number().int().min(1).default(10),
          speed: z.number().int().min(0).default(30),
          subclass: z.string().nullable().optional(),
          spellSlotsUsed: z.string().optional().default("[]"),
          skillProficiencies: z.string().optional().default("[]"),
          skillExpertise: z.string().optional().default("[]"),
          preparedSpells: z.string().optional().default("[]"),
          featureUses: z.string().optional().default("{}"),
          activeConditions: z.string().optional().default("[]"),
          activeDiseases: z.string().optional().default("[]"),
          feats: z.string().optional().default("[]"),
          notes: z.string().optional().default(""),
          equippedItems: z
            .string()
            .optional()
            .default(
              '{"mainHand":null,"offHand":null,"armor":null,"shield":null}',
            ),
        }),
        name: z.string().min(1).max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const {
        _version: _v,
        _exportedAt: _e,
        ...characterData
      } = input.data;

      // Override name if provided
      if (input.name) {
        characterData.name = input.name;
      }

      // Sanitize: clamp currentHp to maxHp
      if (characterData.currentHp > characterData.maxHp) {
        characterData.currentHp = characterData.maxHp;
      }

      const character = await ctx.db.character.create({
        data: {
          ...characterData,
          userId: ctx.user.userId,
        },
      });
      return character;
    }),
});
