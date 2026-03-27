import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../trpc";
import { ITEMS } from "@/lib/itemsData";
import {
  type EquippedItems,
  type EquipmentSlot,
  EMPTY_EQUIPMENT,
  validateEquipment,
  calculateEquippedAC,
  getArmorProficiencyPenalties,
  getEquipmentActions,
  findItemByName,
} from "@/lib/equipmentData";

export const equipItem = protectedProcedure
  .input(
    z.object({
      adventurePlayerId: z.string(),
      itemName: z.string().min(1),
      itemSource: z.string().min(1),
      slot: z.enum(["mainHand", "offHand", "armor", "shield"]),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const adventurePlayer = await ctx.db.adventurePlayer.findUnique({
      where: { id: input.adventurePlayerId },
      include: {
        adventure: true,
        character: true,
        inventoryItems: true,
      },
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
        message: "You do not have access to this character's equipment",
      });
    }

    // Verify item is in inventory
    const inventoryItem = adventurePlayer.inventoryItems.find(
      (inv) =>
        inv.itemName.toLowerCase() === input.itemName.toLowerCase() &&
        inv.itemSource.toLowerCase() === input.itemSource.toLowerCase(),
    );
    if (!inventoryItem) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Item "${input.itemName}" is not in inventory`,
      });
    }

    // Parse current equipment
    let equippedItems: EquippedItems;
    try {
      equippedItems = JSON.parse(
        adventurePlayer.character.equippedItems,
      ) as EquippedItems;
    } catch {
      equippedItems = { ...EMPTY_EQUIPMENT };
    }

    // Validate the equip action
    const slot = input.slot as EquipmentSlot;
    const validation = validateEquipment(
      slot,
      input.itemName,
      equippedItems,
      ITEMS,
    );
    if (!validation.valid) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: validation.reason ?? "Cannot equip item in this slot",
      });
    }

    // If equipping a two-handed weapon in main hand, clear off-hand and shield
    const item = findItemByName(input.itemName, ITEMS);
    if (
      slot === "mainHand" &&
      item?.property?.includes("two-handed")
    ) {
      equippedItems.offHand = null;
      equippedItems.shield = null;
    }

    // Set the item in the slot
    equippedItems[slot] = input.itemName;

    // Persist
    await ctx.db.character.update({
      where: { id: adventurePlayer.characterId },
      data: { equippedItems: JSON.stringify(equippedItems) },
    });

    return { equippedItems };
  });

export const unequipItem = protectedProcedure
  .input(
    z.object({
      adventurePlayerId: z.string(),
      slot: z.enum(["mainHand", "offHand", "armor", "shield"]),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const adventurePlayer = await ctx.db.adventurePlayer.findUnique({
      where: { id: input.adventurePlayerId },
      include: {
        adventure: true,
        character: true,
      },
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
        message: "You do not have access to this character's equipment",
      });
    }

    let equippedItems: EquippedItems;
    try {
      equippedItems = JSON.parse(
        adventurePlayer.character.equippedItems,
      ) as EquippedItems;
    } catch {
      equippedItems = { ...EMPTY_EQUIPMENT };
    }

    const slot = input.slot as EquipmentSlot;
    equippedItems[slot] = null;

    await ctx.db.character.update({
      where: { id: adventurePlayer.characterId },
      data: { equippedItems: JSON.stringify(equippedItems) },
    });

    return { equippedItems };
  });

export const getEquipmentStatus = protectedProcedure
  .input(
    z.object({
      adventurePlayerId: z.string(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const adventurePlayer = await ctx.db.adventurePlayer.findUnique({
      where: { id: input.adventurePlayerId },
      include: {
        adventure: true,
        character: true,
      },
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
        message: "You do not have access to this character's equipment",
      });
    }

    const character = adventurePlayer.character;

    let equippedItems: EquippedItems;
    try {
      equippedItems = JSON.parse(
        character.equippedItems,
      ) as EquippedItems;
    } catch {
      equippedItems = { ...EMPTY_EQUIPMENT };
    }

    // Calculate ability modifiers
    const dexMod = Math.floor((character.dexterity - 10) / 2);
    const conMod = Math.floor((character.constitution - 10) / 2);
    const wisMod = Math.floor((character.wisdom - 10) / 2);

    const acResult = calculateEquippedAC(
      equippedItems,
      dexMod,
      conMod,
      wisMod,
      character.characterClass,
      ITEMS,
    );

    const armorPenalties = getArmorProficiencyPenalties(
      equippedItems,
      character.characterClass,
      character.strength,
      ITEMS,
    );

    const equipmentActions = getEquipmentActions(
      equippedItems,
      character.characterClass,
      character.level,
      ITEMS,
    );

    // Gather weapon mastery info for equipped weapons
    const weaponMasteries: Array<{
      weaponName: string;
      slot: string;
      masteries: string[];
    }> = [];
    for (const [slot, itemName] of Object.entries(equippedItems) as Array<
      [string, string | null]
    >) {
      if (!itemName) continue;
      const item = findItemByName(itemName, ITEMS);
      if (item?.mastery && item.mastery.length > 0) {
        weaponMasteries.push({
          weaponName: item.name,
          slot,
          masteries: item.mastery,
        });
      }
    }

    return {
      equippedItems,
      ac: acResult,
      armorPenalties,
      equipmentActions,
      weaponMasteries,
    };
  });
