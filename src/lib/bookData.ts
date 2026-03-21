import dmgJson from "../../data/book/book-dmg.json";
import xdmgJson from "../../data/book/book-xdmg.json";
import phbJson from "../../data/book/book-phb.json";
import xphbJson from "../../data/book/book-xphb.json";
import mmJson from "../../data/book/book-mm.json";
import xmmJson from "../../data/book/book-xmm.json";
import xgeJson from "../../data/book/book-xge.json";
import tceJson from "../../data/book/book-tce.json";
import vgmJson from "../../data/book/book-vgm.json";
import mtfJson from "../../data/book/book-mtf.json";
import scagJson from "../../data/book/book-scag.json";
import egwJson from "../../data/book/book-egw.json";
import erlwJson from "../../data/book/book-erlw.json";
import ftdJson from "../../data/book/book-ftd.json";
import mpmmJson from "../../data/book/book-mpmm.json";
import ggrJson from "../../data/book/book-ggr.json";
import motJson from "../../data/book/book-mot.json";
import vrgrJson from "../../data/book/book-vrgr.json";
import bggJson from "../../data/book/book-bgg.json";
import sccJson from "../../data/book/book-scc.json";
import satoJson from "../../data/book/book-sato.json";
import bmtJson from "../../data/book/book-bmt.json";
import tdcsrJson from "../../data/book/book-tdcsr.json";
import aiJson from "../../data/book/book-ai.json";
import aagJson from "../../data/book/book-aag.json";
import bamJson from "../../data/book/book-bam.json";
import dodJson from "../../data/book/book-dod.json";
import fraifJson from "../../data/book/book-fraif.json";
import frhofJson from "../../data/book/book-frhof.json";
import hatTgJson from "../../data/book/book-hat-tg.json";
import hfJson from "../../data/book/book-hf.json";
import hffotmJson from "../../data/book/book-hffotm.json";
import mabjovJson from "../../data/book/book-mabjov.json";
import mcv4ecJson from "../../data/book/book-mcv4ec.json";
import mppJson from "../../data/book/book-mpp.json";
import ogaJson from "../../data/book/book-oga.json";
import pafJson from "../../data/book/book-paf.json";
import rmrJson from "../../data/book/book-rmr.json";
import sacJson from "../../data/book/book-sac.json";
import screenJson from "../../data/book/book-screen.json";
import screenDungeonKitJson from "../../data/book/book-screendungeonkit.json";
import screenSpelljammerJson from "../../data/book/book-screenspelljammer.json";
import screenWildernessKitJson from "../../data/book/book-screenwildernesskit.json";
import tdJson from "../../data/book/book-td.json";
import alJson from "../../data/book/book-al.json";
import aatmJson from "../../data/book/book-aatm.json";
import dmtcrgJson from "../../data/book/book-dmtcrg.json";
import psAJson from "../../data/book/book-ps-a.json";
import psDJson from "../../data/book/book-ps-d.json";
import psIJson from "../../data/book/book-ps-i.json";
import psKJson from "../../data/book/book-ps-k.json";
import psXJson from "../../data/book/book-ps-x.json";
import psZJson from "../../data/book/book-ps-z.json";
import xscreenJson from "../../data/book/book-xscreen.json";

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
  name?: string;
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

// ---------------------------------------------------------------------------
// Lookup map — source code → data array (all books)
// ---------------------------------------------------------------------------

type BookJson = { data: BookSection[] };

export const BOOK_DATA_MAP: Record<string, BookSection[]> = {
  dmg: (dmgJson as BookJson).data,
  xdmg: (xdmgJson as BookJson).data,
  phb: (phbJson as BookJson).data,
  xphb: (xphbJson as BookJson).data,
  mm: (mmJson as BookJson).data,
  xmm: (xmmJson as BookJson).data,
  xge: (xgeJson as BookJson).data,
  tce: (tceJson as BookJson).data,
  vgm: (vgmJson as BookJson).data,
  mtf: (mtfJson as BookJson).data,
  scag: (scagJson as BookJson).data,
  egw: (egwJson as BookJson).data,
  erlw: (erlwJson as BookJson).data,
  ftd: (ftdJson as BookJson).data,
  mpmm: (mpmmJson as BookJson).data,
  ggr: (ggrJson as BookJson).data,
  mot: (motJson as BookJson).data,
  vrgr: (vrgrJson as BookJson).data,
  bgg: (bggJson as BookJson).data,
  scc: (sccJson as BookJson).data,
  sato: (satoJson as BookJson).data,
  bmt: (bmtJson as BookJson).data,
  tdcsr: (tdcsrJson as BookJson).data,
  ai: (aiJson as BookJson).data,
  aag: (aagJson as BookJson).data,
  bam: (bamJson as BookJson).data,
  dod: (dodJson as BookJson).data,
  fraif: (fraifJson as BookJson).data,
  frhof: (frhofJson as BookJson).data,
  "hat-tg": (hatTgJson as BookJson).data,
  hf: (hfJson as BookJson).data,
  hffotm: (hffotmJson as BookJson).data,
  mabjov: (mabjovJson as BookJson).data,
  mcv4ec: (mcv4ecJson as BookJson).data,
  mpp: (mppJson as BookJson).data,
  oga: (ogaJson as BookJson).data,
  paf: (pafJson as BookJson).data,
  rmr: (rmrJson as BookJson).data,
  sac: (sacJson as BookJson).data,
  screen: (screenJson as BookJson).data,
  screendungeonkit: (screenDungeonKitJson as BookJson).data,
  screenspelljammer: (screenSpelljammerJson as BookJson).data,
  screenwildernesskit: (screenWildernessKitJson as BookJson).data,
  td: (tdJson as BookJson).data,
  al: (alJson as BookJson).data,
  aatm: (aatmJson as BookJson).data,
  dmtcrg: (dmtcrgJson as BookJson).data,
  "ps-a": (psAJson as BookJson).data,
  "ps-d": (psDJson as BookJson).data,
  "ps-i": (psIJson as BookJson).data,
  "ps-k": (psKJson as BookJson).data,
  "ps-x": (psXJson as BookJson).data,
  "ps-z": (psZJson as BookJson).data,
  xscreen: (xscreenJson as BookJson).data,
};

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
