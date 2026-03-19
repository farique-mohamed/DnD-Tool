import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const adminRouter = createTRPCRouter({
  getDmRequests: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "ADMIN") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const requests = await ctx.db.dmRequest.findMany({
      where: { status: "PENDING" },
      select: {
        id: true,
        requestedAt: true,
        user: {
          select: { id: true, username: true },
        },
      },
      orderBy: { requestedAt: "desc" },
    });

    return requests;
  }),

  approveDmRequest: protectedProcedure
    .input(z.object({ requestId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const dmRequest = await ctx.db.dmRequest.findUnique({
        where: { id: input.requestId },
      });

      if (!dmRequest || dmRequest.status !== "PENDING") {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "DM request not found or is no longer pending.",
        });
      }

      await ctx.db.dmRequest.update({
        where: { id: input.requestId },
        data: {
          status: "APPROVED",
          resolvedAt: new Date(),
          resolvedBy: ctx.user.userId,
        },
      });

      await ctx.db.user.update({
        where: { id: dmRequest.userId },
        data: { role: "DUNGEON_MASTER" },
      });

      return { success: true };
    }),
});
