import dmgJson from "../../data/book/book-dmg.json";
import xdmgJson from "../../data/book/book-xdmg.json";
import phbJson from "../../data/book/book-phb.json";
import xphbJson from "../../data/book/book-xphb.json";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BookEntry {
  type?: string;
  name?: string;
  page?: number;
  id?: string;
  entries?: BookEntry[];
  items?: BookEntry[] | string[];
  // list fields
  style?: string;
  // table fields
  caption?: string;
  colLabels?: string[];
  rows?: unknown[][];
  // quote fields
  by?: string;
  // catch-all for unknown fields
  [key: string]: unknown;
}

export interface BookSection {
  type: string;
  name: string;
  page?: number;
  id?: string;
  entries?: BookEntry[];
}

export interface BookInfo {
  source: string;
  name: string;
  shortName: string;
}

// ---------------------------------------------------------------------------
// Exported book data arrays (the 4 key books statically imported)
// ---------------------------------------------------------------------------

export const DMG_2014_DATA = (dmgJson as { data: BookSection[] }).data;
export const DMG_2024_DATA = (xdmgJson as { data: BookSection[] }).data;
export const PHB_2014_DATA = (phbJson as { data: BookSection[] }).data;
export const PHB_2024_DATA = (xphbJson as { data: BookSection[] }).data;

// ---------------------------------------------------------------------------
// BOOK_LIST — all books with source → display name mapping
// Only includes books that have a corresponding file in data/book/
// ---------------------------------------------------------------------------

export const BOOK_LIST: BookInfo[] = [
  { source: "dmg", name: "Dungeon Master's Guide (2014)", shortName: "DMG" },
  { source: "xdmg", name: "Dungeon Master's Guide (2024)", shortName: "XDMG" },
  { source: "phb", name: "Player's Handbook (2014)", shortName: "PHB" },
  { source: "xphb", name: "Player's Handbook (2024)", shortName: "XPHB" },
  { source: "mm", name: "Monster Manual (2014)", shortName: "MM" },
  { source: "xmm", name: "Monster Manual (2024)", shortName: "XMM" },
  { source: "xge", name: "Xanathar's Guide to Everything", shortName: "XGE" },
  { source: "tce", name: "Tasha's Cauldron of Everything", shortName: "TCE" },
  { source: "vgm", name: "Volo's Guide to Monsters", shortName: "VGM" },
  { source: "mtf", name: "Mordenkainen's Tome of Foes", shortName: "MTF" },
  { source: "scag", name: "Sword Coast Adventurer's Guide", shortName: "SCAG" },
  { source: "egw", name: "Explorer's Guide to Wildemount", shortName: "EGW" },
  { source: "erlw", name: "Eberron: Rising from the Last War", shortName: "ERLW" },
  { source: "ftd", name: "Fizban's Treasury of Dragons", shortName: "FTD" },
  { source: "mpmm", name: "Mordenkainen Presents: Monsters of the Multiverse", shortName: "MPMM" },
  { source: "ggr", name: "Guildmasters' Guide to Ravnica", shortName: "GGR" },
  { source: "mot", name: "Mythic Odysseys of Theros", shortName: "MOT" },
  { source: "vrgr", name: "Van Richten's Guide to Ravenloft", shortName: "VRGR" },
  { source: "bgg", name: "Bigby Presents: Glory of the Giants", shortName: "BGG" },
  { source: "scc", name: "Strixhaven: A Curriculum of Chaos", shortName: "SCC" },
  { source: "sato", name: "Spelljammer: Adventures in Space", shortName: "SatO" },
  { source: "bmt", name: "The Book of Many Things", shortName: "BMT" },
  { source: "tdcsr", name: "Tal'Dorei Campaign Setting Reborn", shortName: "TDCSR" },
  { source: "ai", name: "Acquisitions Incorporated", shortName: "AI" },
  { source: "aag", name: "Astral Adventurer's Guide", shortName: "AAG" },
  { source: "bam", name: "Boo's Astral Menagerie", shortName: "BAM" },
  { source: "dod", name: "Domains of Delight", shortName: "DoD" },
  { source: "fraif", name: "From Abyss I Fall", shortName: "FRAiF" },
  { source: "frhof", name: "Fate Ring of Heroes", shortName: "FRHoF" },
  { source: "hat-tg", name: "Humblewood: the Tenders Guide", shortName: "HAT-TG" },
  { source: "hf", name: "Heroes' Feast", shortName: "HF" },
  { source: "hffotm", name: "Heroes' Feast: Flavors of the Multiverse", shortName: "HFFotM" },
  { source: "mabjov", name: "Minsc and Boo's Journal of Villainy", shortName: "MaBJoV" },
  { source: "mcv4ec", name: "Monstrous Compendium Vol. 4", shortName: "MCV4EC" },
  { source: "mpp", name: "Monsters of the Multiverse Preview", shortName: "MPP" },
  { source: "oga", name: "One Grung Above", shortName: "OGA" },
  { source: "paf", name: "Plane Shift: Amonkhet", shortName: "PAF" },
  { source: "rmr", name: "Dungeons & Dragons vs Rick and Morty", shortName: "RMR" },
  { source: "sac", name: "Sage Advice Compendium", shortName: "SAC" },
  { source: "screen", name: "Dungeon Master's Screen", shortName: "Screen" },
  { source: "screendungeonkit", name: "Dungeon Master's Screen: Dungeon Kit", shortName: "ScreenDK" },
  { source: "screenspelljammer", name: "Dungeon Master's Screen: Spelljammer", shortName: "ScreenSJ" },
  { source: "screenwildernesskit", name: "Dungeon Master's Screen: Wilderness Kit", shortName: "ScreenWK" },
  { source: "td", name: "Tarokka Deck", shortName: "TD" },
  { source: "al", name: "Adventurers League", shortName: "AL" },
  { source: "aatm", name: "Adventure Atlas: The Mortuary", shortName: "AAtM" },
  { source: "dmtcrg", name: "The Deck of Many Things Card Reference Guide", shortName: "DMtCRG" },
  { source: "ps-a", name: "Plane Shift: Amonkhet", shortName: "PS-A" },
  { source: "ps-d", name: "Plane Shift: Dominaria", shortName: "PS-D" },
  { source: "ps-i", name: "Plane Shift: Ixalan", shortName: "PS-I" },
  { source: "ps-k", name: "Plane Shift: Kaladesh", shortName: "PS-K" },
  { source: "ps-x", name: "Plane Shift: Xenagos", shortName: "PS-X" },
  { source: "ps-z", name: "Plane Shift: Zendikar", shortName: "PS-Z" },
  { source: "xscreen", name: "Dungeon Master's Screen (2024)", shortName: "XScreen" },
];
