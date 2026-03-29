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
  splitInventoryItem,
} from "./inventory";
import { equipItem, unequipItem, getEquipmentStatus } from "./equipment";
import {
  createEncounter,
  getEncounter,
  endEncounter,
  addPlayer as addEncounterPlayer,
  addMonster as addEncounterMonster,
  removeParticipant,
  nextTurn,
  updateParticipantHp,
  updateParticipantConditions,
  updateDeathSaves,
  togglePrivateDeathSaves,
  updateInitiative,
} from "./encounter";

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
  splitInventoryItem,

  // Equipment
  equipItem,
  unequipItem,
  getEquipmentStatus,

  // Encounter
  createEncounter,
  getEncounter,
  endEncounter,
  addEncounterPlayer,
  addEncounterMonster,
  removeParticipant,
  nextTurn,
  updateParticipantHp,
  updateParticipantConditions,
  updateDeathSaves,
  togglePrivateDeathSaves,
  updateInitiative,
});
