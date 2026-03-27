import { createTRPCRouter } from "../../trpc";
import { create, list, getById } from "./core";
import { addMonster, removeMonster } from "./monsters";
import { addItem, removeItem } from "./items";
import {
  getInviteCode,
  joinByCode,
  getPendingPlayers,
  resolvePlayer,
  getAcceptedPlayers,
} from "./players";
import {
  sendNote,
  getNotes,
  reactToNote,
  getUnreadNoteCount,
  getUnreadReactionCount,
  createSessionNote,
  getSessionNotes,
  updateSessionNote,
  updatePlayerNote,
  getPlayerNote,
} from "./notes";
import {
  getInventory,
  addInventoryItem,
  addStartingItems,
  removeInventoryItem,
  updateInventoryItem,
} from "./inventory";
import { equipItem, unequipItem, getEquipmentStatus } from "./equipment";

export const adventureRouter = createTRPCRouter({
  // Core CRUD
  create,
  list,
  getById,

  // Monsters
  addMonster,
  removeMonster,

  // Items
  addItem,
  removeItem,

  // Players
  getInviteCode,
  joinByCode,
  getPendingPlayers,
  resolvePlayer,
  getAcceptedPlayers,

  // Notes
  sendNote,
  getNotes,
  reactToNote,
  getUnreadNoteCount,
  getUnreadReactionCount,
  createSessionNote,
  getSessionNotes,
  updateSessionNote,
  updatePlayerNote,
  getPlayerNote,

  // Inventory
  getInventory,
  addInventoryItem,
  addStartingItems,
  removeInventoryItem,
  updateInventoryItem,

  // Equipment
  equipItem,
  unequipItem,
  getEquipmentStatus,
});
