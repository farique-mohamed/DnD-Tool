import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { signToken } from "../../lib/jwt";
import { UserRole } from "@prisma/client";

const SALT_ROUNDS = 12;

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(
      z.object({
        username: z.string().min(1, "Username is required"),
        password: z.string().min(1, "Password is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { username: input.username },
      });

      const passwordValid =
        user !== null && (await bcrypt.compare(input.password, user.password));

      if (!user || !passwordValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid username or password",
        });
      }

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

  register: publicProcedure
    .input(
      z.object({
        username: z.string().min(3, "Username must be at least 3 characters"),
        password: z.string().min(6, "Password must be at least 6 characters"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({
        where: { username: input.username },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username already taken",
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

      const user = await ctx.db.user.create({
        data: {
          username: input.username,
          password: hashedPassword,
          role: UserRole.PLAYER,
        },
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
});
