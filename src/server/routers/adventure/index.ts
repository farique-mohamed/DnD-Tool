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
  updatePlayerConditions,
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
import {
  saveEncounterAsTemplate,
  createEncounterTemplate,
  listEncounterTemplates,
  getEncounterTemplate,
  deleteEncounterTemplate,
  createEncounterFromTemplate,
} from "./encounterTemplate";

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
  updatePlayerConditions,

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

  // Encounter Templates
  saveEncounterAsTemplate,
  createEncounterTemplate,
  listEncounterTemplates,
  getEncounterTemplate,
  deleteEncounterTemplate,
  createEncounterFromTemplate,
});
