import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { signToken } from "../../lib/jwt";

const SALT_ROUNDS = 12;

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

  updateUsername: protectedProcedure
    .input(
      z.object({
        username: z.string().min(3, "Username must be at least 3 characters"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, username: currentUsername, role } = ctx.user;

      if (input.username === currentUsername) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "New username must be different from the current one",
        });
      }

      const existing = await ctx.db.user.findUnique({
        where: { username: input.username },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username already taken",
        });
      }

      const user = await ctx.db.user.update({
        where: { id: userId },
        data: { username: input.username },
      });

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
        token: signToken({ userId: user.id, username: user.username, role: user.role }),
      };
    }),

  updatePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string().min(6, "Password must be at least 6 characters"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx.user;

      const user = await ctx.db.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const passwordValid = await bcrypt.compare(input.currentPassword, user.password);

      if (!passwordValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid username or password",
        });
      }

      const isSamePassword = await bcrypt.compare(input.newPassword, user.password);

      if (isSamePassword) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "New password must be different from the current one",
        });
      }

      const hashedPassword = await bcrypt.hash(input.newPassword, SALT_ROUNDS);

      await ctx.db.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      return {
        success: true,
        token: signToken({ userId: user.id, username: user.username, role: user.role }),
      };
    }),
});
