import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  requestDungeonMaster: protectedProcedure.mutation(async ({ ctx }) => {
    const { userId, role } = ctx.user;

    if (role !== "PLAYER") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only players may petition for the Dungeon Master role.",
      });
    }

    const existingRequest = await ctx.db.dmRequest.findFirst({
      where: { userId, status: "PENDING" },
    });

    if (existingRequest) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "You already have a pending petition for the Dungeon Master role.",
      });
    }

    await ctx.db.dmRequest.create({
      data: { userId, status: "PENDING" },
    });

    return {
      success: true,
      message: "Your request has been submitted. Await the Admin's judgement.",
    };
  }),
});
