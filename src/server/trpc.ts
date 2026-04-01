import { initTRPC, TRPCError } from "@trpc/server";
import type { NextApiRequest } from "next";
import superjson from "superjson";
import { ZodError } from "zod";
import { db } from "./db";
import { verifyToken } from "../lib/jwt";
import type { JwtPayload } from "../lib/jwt";

export const createTRPCContext = async (opts: { req?: NextApiRequest }) => {
  let user: JwtPayload | null = null;

  const authHeader = opts.req?.headers?.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      user = verifyToken(token);
    } catch {
      user = null;
    }
  }

  return {
    db,
    req: opts.req,
    user,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const mergeRouters = t.mergeRouters;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});
