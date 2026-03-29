import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../trpc";

export const getInventory = protectedProcedure
  .input(
    z.object({
      adventureId: z.string(),
      adventurePlayerId: z.string(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const adventurePlayer = await ctx.db.adventurePlayer.findUnique({
      where: { id: input.adventurePlayerId },
      include: { adventure: true },
    });
    if (!adventurePlayer || adventurePlayer.adventureId !== input.adventureId) {
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
        message: "You do not have access to this inventory",
      });
    }

    return ctx.db.characterInventoryItem.findMany({
      where: { adventurePlayerId: input.adventurePlayerId },
      include: {
        addedByUser: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  });

export const addInventoryItem = protectedProcedure
  .input(
    z.object({
      adventurePlayerId: z.string(),
      itemName: z.string().min(1),
      itemSource: z.string().min(1),
      quantity: z.number().int().min(1).optional(),
      customDescription: z.string().optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
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
    if (adventurePlayer.adventure.userId !== ctx.user.userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only the DM can add inventory items",
      });
    }

    // Handle unique constraint — if item already exists, increment quantity
    const existing = await ctx.db.characterInventoryItem.findUnique({
      where: {
        adventurePlayerId_itemName_itemSource: {
          adventurePlayerId: input.adventurePlayerId,
          itemName: input.itemName,
          itemSource: input.itemSource,
        },
      },
    });

    if (existing) {
      return ctx.db.characterInventoryItem.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + (input.quantity ?? 1),
          customDescription: input.customDescription ?? existing.customDescription,
        },
        include: {
          addedByUser: { select: { id: true, username: true } },
        },
      });
    }

    return ctx.db.characterInventoryItem.create({
      data: {
        adventurePlayerId: input.adventurePlayerId,
        itemName: input.itemName,
        itemSource: input.itemSource,
        quantity: input.quantity ?? 1,
        customDescription: input.customDescription,
        addedByUserId: ctx.user.userId,
      },
      include: {
        addedByUser: { select: { id: true, username: true } },
      },
    });
  });

export const addStartingItems = protectedProcedure
  .input(
    z.object({
      adventurePlayerId: z.string(),
      items: z.array(
        z.object({
          name: z.string().min(1),
          source: z.string().min(1),
          quantity: z.number().int().min(1).optional(),
          displayName: z.string().optional(),
        }),
      ),
    }),
  )
  .mutation(async ({ ctx, input }) => {
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
        message: "Only the player or the DM can add starting items",
      });
    }

    // Check that no starting items already exist
    const existingCount = await ctx.db.characterInventoryItem.count({
      where: {
        adventurePlayerId: input.adventurePlayerId,
        isStartingItem: true,
      },
    });
    if (existingCount > 0) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Starting items already added",
      });
    }

    // Create all items, skipping duplicates
    const created = [];
    for (const item of input.items) {
      const existing = await ctx.db.characterInventoryItem.findUnique({
        where: {
          adventurePlayerId_itemName_itemSource: {
            adventurePlayerId: input.adventurePlayerId,
            itemName: item.name,
            itemSource: item.source,
          },
        },
      });

      if (existing) continue;

      const inventoryItem = await ctx.db.characterInventoryItem.create({
        data: {
          adventurePlayerId: input.adventurePlayerId,
          itemName: item.name,
          itemSource: item.source,
          quantity: item.quantity ?? 1,
          isStartingItem: true,
          customDescription: item.displayName ?? null,
          addedByUserId: ctx.user.userId,
        },
        include: {
          addedByUser: { select: { id: true, username: true } },
        },
      });
      created.push(inventoryItem);
    }

    return created;
  });

export const removeInventoryItem = protectedProcedure
  .input(z.object({ inventoryItemId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const item = await ctx.db.characterInventoryItem.findUnique({
      where: { id: input.inventoryItemId },
      include: {
        adventurePlayer: {
          include: { adventure: true },
        },
      },
    });
    if (!item) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Inventory item not found",
      });
    }
    if (item.adventurePlayer.adventure.userId !== ctx.user.userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only the DM can remove inventory items",
      });
    }

    await ctx.db.characterInventoryItem.delete({
      where: { id: input.inventoryItemId },
    });
    return { success: true };
  });

export const updateInventoryItem = protectedProcedure
  .input(
    z.object({
      inventoryItemId: z.string(),
      quantity: z.number().int().min(0).optional(),
      customDescription: z.string().optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const item = await ctx.db.characterInventoryItem.findUnique({
      where: { id: input.inventoryItemId },
      include: {
        adventurePlayer: {
          include: { adventure: true },
        },
      },
    });
    if (!item) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Inventory item not found",
      });
    }
    if (item.adventurePlayer.adventure.userId !== ctx.user.userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only the DM can update inventory items",
      });
    }

    const data: { quantity?: number; customDescription?: string } = {};
    if (input.quantity !== undefined) data.quantity = input.quantity;
    if (input.customDescription !== undefined) data.customDescription = input.customDescription;

    return ctx.db.characterInventoryItem.update({
      where: { id: input.inventoryItemId },
      data,
      include: {
        addedByUser: { select: { id: true, username: true } },
      },
    });
  });

export const splitInventoryItem = protectedProcedure
  .input(
    z.object({
      inventoryItemId: z.string(),
      splitQuantity: z.number().int().min(1),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const item = await ctx.db.characterInventoryItem.findUnique({
      where: { id: input.inventoryItemId },
      include: {
        adventurePlayer: {
          include: { adventure: true },
        },
      },
    });
    if (!item) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Inventory item not found",
      });
    }

    // Allow DM or the owning player
    const isDm = item.adventurePlayer.adventure.userId === ctx.user.userId;
    const isPlayer = item.adventurePlayer.userId === ctx.user.userId;
    if (!isDm && !isPlayer) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Not authorized to split this item",
      });
    }

    if (input.splitQuantity >= item.quantity) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Split quantity must be less than total quantity",
      });
    }

    // Due to unique constraint on [adventurePlayerId, itemName, itemSource],
    // we cannot create a second row for the same item. Instead, splitting
    // reduces the stack quantity (the split-off items are narratively separated).
    return ctx.db.characterInventoryItem.update({
      where: { id: item.id },
      data: { quantity: item.quantity - input.splitQuantity },
      include: {
        addedByUser: { select: { id: true, username: true } },
      },
    });
  });
