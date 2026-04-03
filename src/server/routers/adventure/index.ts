import { createTRPCRouter } from "../../trpc";
import { create, list, getById } from "./core";
import { addMonster, removeMonster } from "./monsters";
import { addNpc, updateNpc, removeNpc, getNpcs, toggleNpcVisibility } from "./npcs";
import { addItem, removeItem } from "./items";
import {
  addSpell,
  removeSpell,
  getSpells,
  addPlayerSpell,
  removePlayerSpell,
  getPlayerSpells,
} from "./spells";
import {
  getInviteCode,
  joinByCode,
  getPendingPlayers,
  resolvePlayer,
  getAcceptedPlayers,
  updatePlayerConditions,
  updatePlayerDiseases,
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
  getFamiliars,
  addFamiliar,
  removeFamiliar,
  updateFamiliar,
} from "./familiars";
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
  renameParticipant,
} from "./encounter";
import {
  saveEncounterAsTemplate,
  createEncounterTemplate,
  listEncounterTemplates,
  getEncounterTemplate,
  deleteEncounterTemplate,
  createEncounterFromTemplate,
} from "./encounterTemplate";
import {
  createSession,
  listSessions,
  getSession,
  updateSession,
  updateSessionStatus,
  deleteSession,
  getUpcomingSessions,
} from "./sessions";

export const adventureRouter = createTRPCRouter({
  // Core CRUD
  create,
  list,
  getById,

  // Monsters
  addMonster,
  removeMonster,

  // NPCs
  addNpc,
  updateNpc,
  removeNpc,
  getNpcs,
  toggleNpcVisibility,

  // Items
  addItem,
  removeItem,

  // Spells
  addSpell,
  removeSpell,
  getSpells,
  addPlayerSpell,
  removePlayerSpell,
  getPlayerSpells,

  // Players
  getInviteCode,
  joinByCode,
  getPendingPlayers,
  resolvePlayer,
  getAcceptedPlayers,
  updatePlayerConditions,
  updatePlayerDiseases,

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

  // Familiars
  getFamiliars,
  addFamiliar,
  removeFamiliar,
  updateFamiliar,

  // Encounter
  createEncounter,
  getEncounter,
  endEncounter,
  addEncounterPlayer,
  addEncounterMonster,
  removeParticipant,
  renameParticipant,
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

  // Sessions
  createSession,
  listSessions,
  getSession,
  updateSession,
  updateSessionStatus,
  deleteSession,
  getUpcomingSessions,
});
