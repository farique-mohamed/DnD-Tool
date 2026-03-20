import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { DICE_TYPES, DICE_SIDES, ROLL_LABELS, ROLL_MODES } from "@/lib/diceConstants";

export const diceRouter = createTRPCRouter({
  roll: protectedProcedure
    .input(
      z.object({
        label: z.enum(ROLL_LABELS),
        rollMode: z.enum(ROLL_MODES).default("NORMAL"),
        dice: z
          .array(
            z.object({
              count: z.number().int().min(1).max(20),
              diceType: z.enum(DICE_TYPES),
            })
          )
          .min(1)
          .max(10),
        adventureId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { label, rollMode, dice, adventureId } = input;

      // Advantage/Disadvantage requires exactly one d20
      if (rollMode === "ADVANTAGE" || rollMode === "DISADVANTAGE") {
        const isExactlyOneD20 =
          dice.length === 1 && dice[0].count === 1 && dice[0].diceType === "d20";
        if (!isExactlyOneD20) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Advantage/Disadvantage requires exactly one d20",
          });
        }
      }

      // Build expression string, e.g. "2d6+1d4" or "d20"
      const diceExpression = dice
        .map((d) => (d.count === 1 ? d.diceType : `${d.count}${d.diceType}`))
        .join("+");

      let result: number;

      if (rollMode === "ADVANTAGE") {
        const roll1 = Math.floor(Math.random() * DICE_SIDES["d20"]) + 1;
        const roll2 = Math.floor(Math.random() * DICE_SIDES["d20"]) + 1;
        result = Math.max(roll1, roll2);
      } else if (rollMode === "DISADVANTAGE") {
        const roll1 = Math.floor(Math.random() * DICE_SIDES["d20"]) + 1;
        const roll2 = Math.floor(Math.random() * DICE_SIDES["d20"]) + 1;
        result = Math.min(roll1, roll2);
      } else {
        // NORMAL: roll each die in each group, sum all results
        result = dice.reduce((total, d) => {
          const sides = DICE_SIDES[d.diceType];
          let groupSum = 0;
          for (let i = 0; i < d.count; i++) {
            groupSum += Math.floor(Math.random() * sides) + 1;
          }
          return total + groupSum;
        }, 0);
      }

      const diceRoll = await ctx.db.diceRoll.create({
        data: {
          userId: ctx.user.userId,
          username: ctx.user.username,
          diceType: diceExpression,
          result,
          label,
          rollMode,
          adventureId: adventureId ?? null,
        },
      });

      return diceRoll;
    }),

  history: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const rolls = await ctx.db.diceRoll.findMany({
        where: { userId: ctx.user.userId },
        orderBy: { rolledAt: "desc" },
        take: input.limit,
        select: {
          id: true,
          diceType: true,
          result: true,
          label: true,
          rollMode: true,
          username: true,
          rolledAt: true,
        },
      });

      return rolls;
    }),

  globalHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const rolls = await ctx.db.diceRoll.findMany({
        orderBy: { rolledAt: "desc" },
        take: input.limit,
        select: {
          id: true,
          diceType: true,
          result: true,
          label: true,
          rollMode: true,
          username: true,
          rolledAt: true,
        },
      });

      return rolls;
    }),
});
