import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const roleEnum = z.enum(["PLAYER", "DUNGEON_MASTER", "ADMIN"]);

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

  rejectDmRequest: protectedProcedure
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
          status: "REJECTED",
          resolvedAt: new Date(),
          resolvedBy: ctx.user.userId,
        },
      });

      return { success: true };
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "ADMIN") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalUsers,
      usersByRoleRaw,
      totalCharacters,
      totalAdventures,
      activeEncounters,
      totalDiceRolls,
      recentSignups,
      pendingDmRequests,
    ] = await Promise.all([
      ctx.db.user.count(),
      ctx.db.user.groupBy({
        by: ["role"],
        _count: { role: true },
      }),
      ctx.db.character.count(),
      ctx.db.adventure.count(),
      ctx.db.encounter.count(),
      ctx.db.diceRoll.count(),
      ctx.db.user.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      ctx.db.dmRequest.count({
        where: { status: "PENDING" },
      }),
    ]);

    const usersByRole = { PLAYER: 0, DUNGEON_MASTER: 0, ADMIN: 0 };
    for (const entry of usersByRoleRaw) {
      usersByRole[entry.role] = entry._count.role;
    }

    return {
      totalUsers,
      usersByRole,
      totalCharacters,
      totalAdventures,
      activeEncounters,
      totalDiceRolls,
      recentSignups,
      pendingDmRequests,
    };
  }),

  getUsers: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        role: roleEnum.optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const { search, role, page, pageSize } = input;

      const where: Record<string, unknown> = {};
      if (search) {
        where.username = { contains: search, mode: "insensitive" };
      }
      if (role) {
        where.role = role;
      }

      const [users, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          select: {
            id: true,
            username: true,
            role: true,
            createdAt: true,
            _count: {
              select: {
                characters: true,
                adventures: true,
                diceRolls: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.db.user.count({ where }),
      ]);

      return { users, total, page, pageSize };
    }),

  updateUserRole: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        role: roleEnum,
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (input.userId === ctx.user.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot change your own role.",
        });
      }

      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found.",
        });
      }

      await ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      });

      return { success: true };
    }),

  deleteUser: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (input.userId === ctx.user.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete your own account.",
        });
      }

      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found.",
        });
      }

      // Delete related data in the correct order to respect foreign keys.
      // Prisma does not cascade deletes by default unless onDelete: Cascade
      // is set on every relation, so we handle it explicitly.
      await ctx.db.$transaction(async (tx) => {
        // Delete encounter participants linked through adventure players
        await tx.encounterParticipant.deleteMany({
          where: { adventurePlayer: { userId: input.userId } },
        });

        // Delete character inventory items linked through adventure players
        await tx.characterInventoryItem.deleteMany({
          where: { adventurePlayer: { userId: input.userId } },
        });

        // Delete inventory items added by this user (via addedByUserId)
        await tx.characterInventoryItem.deleteMany({
          where: { addedByUserId: input.userId },
        });

        // Delete adventure players
        await tx.adventurePlayer.deleteMany({
          where: { userId: input.userId },
        });

        // Delete DM notes (sent and received)
        await tx.dmNote.deleteMany({
          where: { OR: [{ fromUserId: input.userId }, { toUserId: input.userId }] },
        });

        // Delete session notes
        await tx.sessionNote.deleteMany({
          where: { userId: input.userId },
        });

        // For adventures owned by this user, clean up nested data
        const ownedAdventures = await tx.adventure.findMany({
          where: { userId: input.userId },
          select: { id: true },
        });
        const ownedAdventureIds = ownedAdventures.map((a) => a.id);

        if (ownedAdventureIds.length > 0) {
          // Delete encounter participants in owned adventures' encounters
          await tx.encounterParticipant.deleteMany({
            where: { encounter: { adventureId: { in: ownedAdventureIds } } },
          });

          // Delete encounters
          await tx.encounter.deleteMany({
            where: { adventureId: { in: ownedAdventureIds } },
          });

          // Delete inventory items for adventure players in owned adventures
          await tx.characterInventoryItem.deleteMany({
            where: { adventurePlayer: { adventureId: { in: ownedAdventureIds } } },
          });

          // Delete adventure players in owned adventures
          await tx.adventurePlayer.deleteMany({
            where: { adventureId: { in: ownedAdventureIds } },
          });

          // Delete DM notes in owned adventures
          await tx.dmNote.deleteMany({
            where: { adventureId: { in: ownedAdventureIds } },
          });

          // Delete session notes in owned adventures
          await tx.sessionNote.deleteMany({
            where: { adventureId: { in: ownedAdventureIds } },
          });

          // Delete adventure monsters and items
          await tx.adventureMonster.deleteMany({
            where: { adventureId: { in: ownedAdventureIds } },
          });
          await tx.adventureItem.deleteMany({
            where: { adventureId: { in: ownedAdventureIds } },
          });

          // Delete owned adventures
          await tx.adventure.deleteMany({
            where: { userId: input.userId },
          });
        }

        // Delete characters
        await tx.character.deleteMany({
          where: { userId: input.userId },
        });

        // Delete dice rolls
        await tx.diceRoll.deleteMany({
          where: { userId: input.userId },
        });

        // Delete DM requests
        await tx.dmRequest.deleteMany({
          where: { userId: input.userId },
        });

        // Finally delete the user
        await tx.user.delete({
          where: { id: input.userId },
        });
      });

      return { success: true };
    }),

  getAdventures: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const { search, page, pageSize } = input;

      const where: Record<string, unknown> = {};
      if (search) {
        where.name = { contains: search, mode: "insensitive" };
      }

      const [adventures, total] = await Promise.all([
        ctx.db.adventure.findMany({
          where,
          select: {
            id: true,
            name: true,
            source: true,
            createdAt: true,
            user: {
              select: { id: true, username: true },
            },
            _count: {
              select: {
                players: true,
                monsters: true,
                items: true,
              },
            },
            encounter: {
              select: { id: true, round: true },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.db.adventure.count({ where }),
      ]);

      return { adventures, total, page, pageSize };
    }),
});
