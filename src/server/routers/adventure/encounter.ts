import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../trpc";

async function getAdventureAndCheckAccess(db: any, adventureId: string, userId: string) {
  const adventure = await db.adventure.findUnique({ where: { id: adventureId } });
  if (!adventure) throw new TRPCError({ code: "NOT_FOUND", message: "Adventure not found" });
  return { adventure, isOwner: adventure.userId === userId };
}

export const createEncounter = protectedProcedure
  .input(z.object({ adventureId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const { adventure, isOwner } = await getAdventureAndCheckAccess(ctx.db, input.adventureId, ctx.user.userId);
    if (!isOwner) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only the DM can create encounters" });
    }

    const existing = await ctx.db.encounter.findUnique({
      where: { adventureId: input.adventureId },
    });
    if (existing) {
      throw new TRPCError({ code: "CONFLICT", message: "An encounter already exists for this adventure" });
    }

    return ctx.db.encounter.create({
      data: { adventureId: input.adventureId },
      include: { participants: true },
    });
  });

export const getEncounter = protectedProcedure
  .input(z.object({ adventureId: z.string() }))
  .query(async ({ ctx, input }) => {
    const { adventure, isOwner } = await getAdventureAndCheckAccess(ctx.db, input.adventureId, ctx.user.userId);

    if (!isOwner) {
      const membership = await ctx.db.adventurePlayer.findUnique({
        where: { adventureId_userId: { adventureId: input.adventureId, userId: ctx.user.userId } },
      });
      if (!membership || membership.status !== "ACCEPTED") {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this adventure" });
      }
    }

    const encounter = await ctx.db.encounter.findUnique({
      where: { adventureId: input.adventureId },
      include: {
        participants: {
          include: {
            adventurePlayer: {
              include: {
                user: { select: { id: true, username: true } },
                character: true,
              },
            },
          },
          orderBy: [{ initiativeRoll: "desc" }, { sortOrder: "asc" }],
        },
      },
    });

    if (!encounter) return null;

    if (isOwner) return encounter;

    const mapped = {
      ...encounter,
      participants: encounter.participants.map((p: any) => {
        let participant = { ...p };

        if (p.type === "MONSTER") {
          participant.maxHp = null;
          participant.currentHp = null;
          participant.tempHp = null;
        }

        if (encounter.privateDeathSaves) {
          const isOwnParticipant = p.adventurePlayer?.userId === ctx.user.userId;
          if (!isOwnParticipant) {
            participant.deathSaveSuccesses = null;
            participant.deathSaveFailures = null;
          }
        }

        return participant;
      }),
    };

    return mapped;
  });

export const endEncounter = protectedProcedure
  .input(z.object({ adventureId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const { adventure, isOwner } = await getAdventureAndCheckAccess(ctx.db, input.adventureId, ctx.user.userId);
    if (!isOwner) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only the DM can end encounters" });
    }

    const encounter = await ctx.db.encounter.findUnique({
      where: { adventureId: input.adventureId },
      include: {
        participants: {
          include: {
            adventurePlayer: { include: { character: true } },
          },
        },
      },
    });
    if (!encounter) {
      throw new TRPCError({ code: "NOT_FOUND", message: "No encounter found" });
    }

    for (const p of encounter.participants) {
      if (p.type === "PLAYER" && p.adventurePlayer?.character) {
        const conditions: string[] = JSON.parse(p.conditions);
        await ctx.db.character.update({
          where: { id: p.adventurePlayer.character.id },
          data: { activeConditions: JSON.stringify(conditions) },
        });
      }
    }

    await ctx.db.encounter.delete({ where: { id: encounter.id } });

    return { success: true };
  });

export const addPlayer = protectedProcedure
  .input(
    z.object({
      adventureId: z.string(),
      adventurePlayerId: z.string(),
      initiativeRoll: z.number().int(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { adventure, isOwner } = await getAdventureAndCheckAccess(ctx.db, input.adventureId, ctx.user.userId);
    if (!isOwner) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only the DM can add players to encounters" });
    }

    const encounter = await ctx.db.encounter.findUnique({
      where: { adventureId: input.adventureId },
    });
    if (!encounter) {
      throw new TRPCError({ code: "NOT_FOUND", message: "No encounter found" });
    }

    const adventurePlayer = await ctx.db.adventurePlayer.findUnique({
      where: { id: input.adventurePlayerId },
      include: { character: true },
    });
    if (!adventurePlayer || adventurePlayer.adventureId !== input.adventureId || adventurePlayer.status !== "ACCEPTED") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Player not found or not accepted in this adventure" });
    }

    const existing = await ctx.db.encounterParticipant.findFirst({
      where: { encounterId: encounter.id, adventurePlayerId: input.adventurePlayerId },
    });
    if (existing) {
      throw new TRPCError({ code: "CONFLICT", message: "Player is already in the encounter" });
    }

    const conditions = adventurePlayer.character?.activeConditions
      ? adventurePlayer.character.activeConditions
      : "[]";

    return ctx.db.encounterParticipant.create({
      data: {
        encounterId: encounter.id,
        type: "PLAYER",
        initiativeRoll: input.initiativeRoll,
        adventurePlayerId: input.adventurePlayerId,
        maxHp: adventurePlayer.character?.maxHp ?? null,
        currentHp: adventurePlayer.character?.currentHp ?? null,
        tempHp: adventurePlayer.character?.tempHp ?? 0,
        armorClass: adventurePlayer.character?.armorClass ?? null,
        conditions,
      },
      include: {
        adventurePlayer: {
          include: {
            user: { select: { id: true, username: true } },
            character: true,
          },
        },
      },
    });
  });

export const addMonster = protectedProcedure
  .input(
    z.object({
      adventureId: z.string(),
      name: z.string().min(1),
      monsterSource: z.string(),
      maxHp: z.number().int().min(1),
      armorClass: z.number().int().min(1),
      initiativeRoll: z.number().int(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const { adventure, isOwner } = await getAdventureAndCheckAccess(ctx.db, input.adventureId, ctx.user.userId);
    if (!isOwner) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only the DM can add monsters" });
    }

    const encounter = await ctx.db.encounter.findUnique({
      where: { adventureId: input.adventureId },
    });
    if (!encounter) {
      throw new TRPCError({ code: "NOT_FOUND", message: "No encounter found" });
    }

    return ctx.db.encounterParticipant.create({
      data: {
        encounterId: encounter.id,
        type: "MONSTER",
        initiativeRoll: input.initiativeRoll,
        name: input.name,
        monsterSource: input.monsterSource,
        maxHp: input.maxHp,
        currentHp: input.maxHp,
        armorClass: input.armorClass,
      },
    });
  });

export const removeParticipant = protectedProcedure
  .input(z.object({ participantId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const participant = await ctx.db.encounterParticipant.findUnique({
      where: { id: input.participantId },
      include: {
        encounter: { include: { adventure: true } },
        adventurePlayer: { include: { character: true } },
      },
    });
    if (!participant) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Participant not found" });
    }
    if (participant.encounter.adventure.userId !== ctx.user.userId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only the DM can remove participants" });
    }

    if (participant.type === "PLAYER" && participant.adventurePlayer?.character) {
      const conditions: string[] = JSON.parse(participant.conditions);
      await ctx.db.character.update({
        where: { id: participant.adventurePlayer.character.id },
        data: { activeConditions: JSON.stringify(conditions) },
      });
    }

    await ctx.db.encounterParticipant.delete({ where: { id: input.participantId } });

    return { success: true };
  });

export const nextTurn = protectedProcedure
  .input(z.object({ adventureId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const { adventure, isOwner } = await getAdventureAndCheckAccess(ctx.db, input.adventureId, ctx.user.userId);

    const encounter = await ctx.db.encounter.findUnique({
      where: { adventureId: input.adventureId },
      include: {
        participants: {
          include: { adventurePlayer: true },
          orderBy: [{ initiativeRoll: "desc" }, { sortOrder: "asc" }],
        },
      },
    });
    if (!encounter) {
      throw new TRPCError({ code: "NOT_FOUND", message: "No encounter found" });
    }

    if (!isOwner) {
      const currentParticipant = encounter.participants[encounter.currentTurnIndex];
      if (!currentParticipant || !currentParticipant.adventurePlayer || currentParticipant.adventurePlayer.userId !== ctx.user.userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only advance the turn when it is your turn" });
      }
    }

    const activeParticipants = encounter.participants.filter((p: any) => p.isActive);
    if (activeParticipants.length === 0) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No active participants" });
    }

    let nextIndex = encounter.currentTurnIndex;
    let round = encounter.round;
    let wrapped = false;

    for (let i = 0; i < encounter.participants.length; i++) {
      nextIndex++;
      if (nextIndex >= encounter.participants.length) {
        nextIndex = 0;
        wrapped = true;
      }
      if (encounter.participants[nextIndex].isActive) {
        break;
      }
    }

    if (wrapped) {
      round++;
    }

    return ctx.db.encounter.update({
      where: { id: encounter.id },
      data: { currentTurnIndex: nextIndex, round },
      include: {
        participants: {
          include: {
            adventurePlayer: {
              include: {
                user: { select: { id: true, username: true } },
                character: true,
              },
            },
          },
          orderBy: [{ initiativeRoll: "desc" }, { sortOrder: "asc" }],
        },
      },
    });
  });

export const updateParticipantHp = protectedProcedure
  .input(
    z.object({
      participantId: z.string(),
      type: z.enum(["damage", "heal", "setTempHp"]),
      amount: z.number().int().min(0),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const participant = await ctx.db.encounterParticipant.findUnique({
      where: { id: input.participantId },
      include: {
        encounter: { include: { adventure: true } },
        adventurePlayer: { include: { character: true } },
      },
    });
    if (!participant) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Participant not found" });
    }

    const isDm = participant.encounter.adventure.userId === ctx.user.userId;
    const isOwnPlayer = participant.type === "PLAYER" && participant.adventurePlayer?.userId === ctx.user.userId;

    if (participant.type === "MONSTER" && !isDm) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only the DM can update monster HP" });
    }
    if (participant.type === "PLAYER" && !isDm && !isOwnPlayer) {
      throw new TRPCError({ code: "FORBIDDEN", message: "You can only update your own character's HP" });
    }

    let currentHp = participant.currentHp ?? 0;
    let tempHp = participant.tempHp;
    const maxHp = participant.maxHp ?? 0;

    if (input.type === "heal") {
      currentHp = Math.min(maxHp, currentHp + input.amount);
    } else if (input.type === "damage") {
      const remainingDamage = Math.max(0, input.amount - tempHp);
      tempHp = Math.max(0, tempHp - input.amount);
      currentHp = Math.max(0, currentHp - remainingDamage);
    } else if (input.type === "setTempHp") {
      tempHp = input.amount;
    }

    const updated = await ctx.db.encounterParticipant.update({
      where: { id: input.participantId },
      data: { currentHp, tempHp },
    });

    if (participant.type === "PLAYER" && participant.adventurePlayer?.character) {
      await ctx.db.character.update({
        where: { id: participant.adventurePlayer.character.id },
        data: { currentHp, tempHp },
      });
    }

    return updated;
  });

export const updateParticipantConditions = protectedProcedure
  .input(
    z.object({
      participantId: z.string(),
      conditions: z.array(z.string()),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const participant = await ctx.db.encounterParticipant.findUnique({
      where: { id: input.participantId },
      include: {
        encounter: { include: { adventure: true } },
        adventurePlayer: { include: { character: true } },
      },
    });
    if (!participant) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Participant not found" });
    }

    const isDm = participant.encounter.adventure.userId === ctx.user.userId;
    const isOwnPlayer = participant.type === "PLAYER" && participant.adventurePlayer?.userId === ctx.user.userId;

    if (!isDm && !isOwnPlayer) {
      throw new TRPCError({ code: "FORBIDDEN", message: "You can only update your own conditions" });
    }

    const updated = await ctx.db.encounterParticipant.update({
      where: { id: input.participantId },
      data: { conditions: JSON.stringify(input.conditions) },
    });

    if (participant.type === "PLAYER" && participant.adventurePlayer?.character) {
      await ctx.db.character.update({
        where: { id: participant.adventurePlayer.character.id },
        data: { activeConditions: JSON.stringify(input.conditions) },
      });
    }

    return updated;
  });

export const updateDeathSaves = protectedProcedure
  .input(
    z.object({
      participantId: z.string(),
      successes: z.number().int().min(0).max(3),
      failures: z.number().int().min(0).max(3),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const participant = await ctx.db.encounterParticipant.findUnique({
      where: { id: input.participantId },
      include: {
        encounter: { include: { adventure: true } },
        adventurePlayer: true,
      },
    });
    if (!participant) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Participant not found" });
    }

    const isDm = participant.encounter.adventure.userId === ctx.user.userId;
    const isOwnPlayer = participant.adventurePlayer?.userId === ctx.user.userId;

    if (!isDm && !isOwnPlayer) {
      throw new TRPCError({ code: "FORBIDDEN", message: "You can only update your own death saves" });
    }

    return ctx.db.encounterParticipant.update({
      where: { id: input.participantId },
      data: {
        deathSaveSuccesses: input.successes,
        deathSaveFailures: input.failures,
      },
    });
  });

export const togglePrivateDeathSaves = protectedProcedure
  .input(z.object({ adventureId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const { adventure, isOwner } = await getAdventureAndCheckAccess(ctx.db, input.adventureId, ctx.user.userId);
    if (!isOwner) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only the DM can toggle private death saves" });
    }

    const encounter = await ctx.db.encounter.findUnique({
      where: { adventureId: input.adventureId },
    });
    if (!encounter) {
      throw new TRPCError({ code: "NOT_FOUND", message: "No encounter found" });
    }

    return ctx.db.encounter.update({
      where: { id: encounter.id },
      data: { privateDeathSaves: !encounter.privateDeathSaves },
    });
  });

export const updateInitiative = protectedProcedure
  .input(
    z.object({
      participantId: z.string(),
      initiativeRoll: z.number().int(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const participant = await ctx.db.encounterParticipant.findUnique({
      where: { id: input.participantId },
      include: {
        encounter: { include: { adventure: true } },
      },
    });
    if (!participant) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Participant not found" });
    }
    if (participant.encounter.adventure.userId !== ctx.user.userId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only the DM can update initiative" });
    }

    return ctx.db.encounterParticipant.update({
      where: { id: input.participantId },
      data: { initiativeRoll: input.initiativeRoll },
    });
  });
