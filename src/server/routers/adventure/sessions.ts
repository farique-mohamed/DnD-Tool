import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../trpc";

async function getAdventureAndCheckAccess(db: any, adventureId: string, userId: string) {
  const adventure = await db.adventure.findUnique({ where: { id: adventureId } });
  if (!adventure) throw new TRPCError({ code: "NOT_FOUND", message: "Adventure not found" });
  return { adventure, isOwner: adventure.userId === userId };
}

async function getSessionWithAdventure(db: any, sessionId: string) {
  const session = await db.adventureSession.findUnique({
    where: { id: sessionId },
    include: { adventure: true },
  });
  if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
  return session;
}

async function checkAdventureMembership(db: any, adventureId: string, userId: string) {
  const { adventure, isOwner } = await getAdventureAndCheckAccess(db, adventureId, userId);
  if (!isOwner) {
    const isPlayer = await db.adventurePlayer.findFirst({
      where: { adventureId, userId, status: "ACCEPTED" },
    });
    if (!isPlayer) {
      throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this adventure" });
    }
  }
  return { adventure, isOwner };
}

export const createSession = protectedProcedure
  .input(
    z.object({
      adventureId: z.string(),
      title: z.string().min(1).max(200),
      description: z.string().max(2000).optional(),
      scheduledAt: z.date(),
      duration: z.number().int().min(15).max(1440).optional(),
      location: z.string().max(200).optional(),
      inGameDate: z.string().max(200).optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { adventure, isOwner } = await getAdventureAndCheckAccess(ctx.db, input.adventureId, ctx.user.userId);
    if (!isOwner) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only the DM can manage sessions" });
    }

    return ctx.db.adventureSession.create({
      data: {
        adventureId: input.adventureId,
        title: input.title,
        description: input.description,
        scheduledAt: input.scheduledAt,
        duration: input.duration,
        location: input.location,
        inGameDate: input.inGameDate,
      },
    });
  });

export const listSessions = protectedProcedure
  .input(z.object({ adventureId: z.string() }))
  .query(async ({ ctx, input }) => {
    await checkAdventureMembership(ctx.db, input.adventureId, ctx.user.userId);

    const sessions = await ctx.db.adventureSession.findMany({
      where: { adventureId: input.adventureId },
      orderBy: { scheduledAt: "asc" },
      include: {
        adventure: { select: { id: true, name: true } },
      },
    });

    return sessions;
  });

export const getSession = protectedProcedure
  .input(z.object({ sessionId: z.string() }))
  .query(async ({ ctx, input }) => {
    const session = await getSessionWithAdventure(ctx.db, input.sessionId);
    await checkAdventureMembership(ctx.db, session.adventureId, ctx.user.userId);

    return ctx.db.adventureSession.findUnique({
      where: { id: input.sessionId },
      include: {
        adventure: { select: { id: true, name: true, source: true } },
      },
    });
  });

export const updateSession = protectedProcedure
  .input(
    z.object({
      sessionId: z.string(),
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(2000).optional(),
      scheduledAt: z.date().optional(),
      duration: z.number().int().min(15).max(1440).optional(),
      location: z.string().max(200).optional(),
      inGameDate: z.string().max(200).optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const session = await getSessionWithAdventure(ctx.db, input.sessionId);
    if (session.adventure.userId !== ctx.user.userId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only the DM can manage sessions" });
    }

    const { sessionId, ...updateData } = input;

    return ctx.db.adventureSession.update({
      where: { id: sessionId },
      data: updateData,
    });
  });

export const updateSessionStatus = protectedProcedure
  .input(
    z.object({
      sessionId: z.string(),
      status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const session = await getSessionWithAdventure(ctx.db, input.sessionId);
    if (session.adventure.userId !== ctx.user.userId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only the DM can manage sessions" });
    }

    return ctx.db.adventureSession.update({
      where: { id: input.sessionId },
      data: { status: input.status },
    });
  });

export const deleteSession = protectedProcedure
  .input(z.object({ sessionId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const session = await getSessionWithAdventure(ctx.db, input.sessionId);
    if (session.adventure.userId !== ctx.user.userId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only the DM can manage sessions" });
    }

    await ctx.db.adventureSession.delete({ where: { id: input.sessionId } });

    return { success: true };
  });

export const getUpcomingSessions = protectedProcedure
  .query(async ({ ctx }) => {
    const now = new Date();

    const sessions = await ctx.db.adventureSession.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { gte: now },
        adventure: {
          OR: [
            { userId: ctx.user.userId },
            {
              players: {
                some: {
                  userId: ctx.user.userId,
                  status: "ACCEPTED",
                },
              },
            },
          ],
        },
      },
      orderBy: { scheduledAt: "asc" },
      take: 20,
      include: {
        adventure: { select: { id: true, name: true, source: true, userId: true } },
      },
    });

    return sessions.map((session: any) => ({
      ...session,
      isDm: session.adventure.userId === ctx.user.userId,
    }));
  });
