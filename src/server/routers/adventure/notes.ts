import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../trpc";

export const sendNote = protectedProcedure
  .input(
    z.object({
      adventureId: z.string(),
      toUserId: z.string(),
      characterId: z.string(),
      content: z.string().min(1).max(2000),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const adventure = await ctx.db.adventure.findUnique({
      where: { id: input.adventureId },
    });
    if (!adventure) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Adventure not found",
      });
    }
    if (adventure.userId !== ctx.user.userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only the adventure owner can send notes",
      });
    }

    return ctx.db.dmNote.create({
      data: {
        adventureId: input.adventureId,
        fromUserId: ctx.user.userId,
        toUserId: input.toUserId,
        characterId: input.characterId,
        content: input.content,
      },
      include: {
        toUser: { select: { id: true, username: true } },
      },
    });
  });

export const getNotes = protectedProcedure
  .input(
    z.object({
      adventureId: z.string(),
      characterId: z.string(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const adventure = await ctx.db.adventure.findUnique({
      where: { id: input.adventureId },
    });
    if (!adventure) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Adventure not found",
      });
    }

    const isOwner = adventure.userId === ctx.user.userId;

    // If the DM is viewing, mark all unread reactions as read
    if (isOwner) {
      await ctx.db.dmNote.updateMany({
        where: {
          adventureId: input.adventureId,
          characterId: input.characterId,
          fromUserId: ctx.user.userId,
          reaction: { not: null },
          reactionReadAt: null,
        },
        data: {
          reactionReadAt: new Date(),
        },
      });
    }

    // If not the owner, verify the caller is an accepted player with this character
    if (!isOwner) {
      const membership = await ctx.db.adventurePlayer.findFirst({
        where: {
          adventureId: input.adventureId,
          userId: ctx.user.userId,
          characterId: input.characterId,
          status: "ACCEPTED",
        },
      });
      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to these notes",
        });
      }

      // Mark all unread notes as read for the target player
      await ctx.db.dmNote.updateMany({
        where: {
          adventureId: input.adventureId,
          characterId: input.characterId,
          toUserId: ctx.user.userId,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });
    }

    return ctx.db.dmNote.findMany({
      where: {
        adventureId: input.adventureId,
        characterId: input.characterId,
      },
      include: {
        fromUser: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  });

export const reactToNote = protectedProcedure
  .input(
    z.object({
      noteId: z.string(),
      reaction: z.enum(["THUMBS_UP", "THUMBS_DOWN"]).nullable(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const note = await ctx.db.dmNote.findUnique({
      where: { id: input.noteId },
    });
    if (!note) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Note not found",
      });
    }
    if (note.toUserId !== ctx.user.userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only the recipient can react to a note",
      });
    }

    return ctx.db.dmNote.update({
      where: { id: input.noteId },
      data: {
        reaction: input.reaction,
        reactionReadAt: null,
      },
    });
  });

export const getUnreadNoteCount = protectedProcedure
  .query(async ({ ctx }) => {
    const counts = await ctx.db.dmNote.groupBy({
      by: ["adventureId"],
      where: {
        toUserId: ctx.user.userId,
        readAt: null,
      },
      _count: {
        id: true,
      },
    });

    return counts.map((c) => ({
      adventureId: c.adventureId,
      count: c._count.id,
    }));
  });

export const getUnreadReactionCount = protectedProcedure
  .query(async ({ ctx }) => {
    const counts = await ctx.db.dmNote.groupBy({
      by: ["adventureId", "characterId"],
      where: {
        fromUserId: ctx.user.userId,
        reaction: { not: null },
        reactionReadAt: null,
      },
      _count: {
        id: true,
      },
    });

    return counts.map((c) => ({
      adventureId: c.adventureId,
      characterId: c.characterId,
      count: c._count.id,
    }));
  });

export const createSessionNote = protectedProcedure
  .input(
    z.object({
      adventureId: z.string(),
      title: z.string().min(1),
      content: z.string().default(""),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const adventure = await ctx.db.adventure.findUnique({
      where: { id: input.adventureId },
      include: {
        players: {
          where: { userId: ctx.user.userId, status: "ACCEPTED" },
        },
      },
    });
    if (!adventure) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Adventure not found",
      });
    }
    const isOwner = adventure.userId === ctx.user.userId;
    const isPlayer = adventure.players.length > 0;
    if (!isOwner && !isPlayer) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only adventure members can create session notes",
      });
    }

    return ctx.db.sessionNote.create({
      data: {
        adventureId: input.adventureId,
        userId: ctx.user.userId,
        title: input.title,
        content: input.content,
      },
      include: {
        user: { select: { id: true, username: true } },
      },
    });
  });

export const getSessionNotes = protectedProcedure
  .input(z.object({ adventureId: z.string() }))
  .query(async ({ ctx, input }) => {
    const adventure = await ctx.db.adventure.findUnique({
      where: { id: input.adventureId },
      include: {
        players: {
          where: { userId: ctx.user.userId, status: "ACCEPTED" },
        },
      },
    });
    if (!adventure) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Adventure not found",
      });
    }
    const isOwner = adventure.userId === ctx.user.userId;
    const isPlayer = adventure.players.length > 0;
    if (!isOwner && !isPlayer) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only adventure members can view session notes",
      });
    }

    return ctx.db.sessionNote.findMany({
      where: {
        adventureId: input.adventureId,
        userId: ctx.user.userId,
      },
      include: {
        user: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  });

export const updateSessionNote = protectedProcedure
  .input(
    z.object({
      noteId: z.string(),
      title: z.string().min(1).optional(),
      content: z.string().optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const note = await ctx.db.sessionNote.findUnique({
      where: { id: input.noteId },
    });
    if (!note) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Session note not found",
      });
    }
    if (note.userId !== ctx.user.userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only the author can edit a session note",
      });
    }

    const data: { title?: string; content?: string } = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.content !== undefined) data.content = input.content;

    return ctx.db.sessionNote.update({
      where: { id: input.noteId },
      data,
      include: {
        user: { select: { id: true, username: true } },
      },
    });
  });

export const updatePlayerNote = protectedProcedure
  .input(
    z.object({
      adventurePlayerId: z.string(),
      content: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const adventurePlayer = await ctx.db.adventurePlayer.findUnique({
      where: { id: input.adventurePlayerId },
    });
    if (!adventurePlayer) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Adventure player not found",
      });
    }
    if (adventurePlayer.userId !== ctx.user.userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only the player can update their own note",
      });
    }

    return ctx.db.adventurePlayer.update({
      where: { id: input.adventurePlayerId },
      data: { playerNote: input.content },
    });
  });

export const getPlayerNote = protectedProcedure
  .input(
    z.object({
      adventurePlayerId: z.string(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const adventurePlayer = await ctx.db.adventurePlayer.findUnique({
      where: { id: input.adventurePlayerId },
      include: { adventure: true },
    });
    if (!adventurePlayer) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Adventure player not found",
      });
    }

    const isOwner = adventurePlayer.adventure.userId === ctx.user.userId;
    const isPlayer = adventurePlayer.userId === ctx.user.userId;
    if (!isOwner && !isPlayer) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have access to this player note",
      });
    }

    return { playerNote: adventurePlayer.playerNote };
  });
