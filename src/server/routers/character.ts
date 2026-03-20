import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const ALIGNMENTS = [
  "Lawful Good", "Neutral Good", "Chaotic Good",
  "Lawful Neutral", "True Neutral", "Chaotic Neutral",
  "Lawful Evil", "Neutral Evil", "Chaotic Evil",
] as const;

const abilityScore = z.number().int().min(1).max(20);

export const characterRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      race: z.string().min(1),
      characterClass: z.string().min(1),
      level: z.number().int().min(1).max(20).default(1),
      alignment: z.enum(ALIGNMENTS).default("True Neutral"),
      backstory: z.string().optional(),
      strength: abilityScore.default(10),
      dexterity: abilityScore.default(10),
      constitution: abilityScore.default(10),
      intelligence: abilityScore.default(10),
      wisdom: abilityScore.default(10),
      charisma: abilityScore.default(10),
      maxHp: z.number().int().min(1).default(10),
      armorClass: z.number().int().min(1).default(10),
      speed: z.number().int().min(0).default(30),
    }))
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

  list: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.character.findMany({
        where: { userId: ctx.user.userId },
        orderBy: { createdAt: "desc" },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const character = await ctx.db.character.findFirst({
        where: { id: input.id, userId: ctx.user.userId },
      });
      if (!character) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Character not found" });
      }
      return character;
    }),
});
