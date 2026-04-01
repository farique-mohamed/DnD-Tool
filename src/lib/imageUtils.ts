// ---------------------------------------------------------------------------
// 5etools Image URL Utilities
// ---------------------------------------------------------------------------
// Constructs image URLs from the 5etools-img GitHub mirror repository.
// Base URL: https://raw.githubusercontent.com/5etools-mirror-3/5etools-img/main
//
// Repository structure:
//   bestiary/[SOURCE]/[CreatureName].webp
//   items/[SOURCE]/[ItemName].webp
//   spells/[SOURCE]/[SpellName].webp
//   adventure/[SOURCE]/[filename]
//   book/[SOURCE]/[filename]
// ---------------------------------------------------------------------------

const BASE_URL =
  "https://raw.githubusercontent.com/5etools-mirror-3/5etools-img/main";

// ---------------------------------------------------------------------------
// Source-code casing map
// ---------------------------------------------------------------------------
// The app stores adventure/book source codes in lowercase (e.g. "dosi"),
// but the 5etools-img repo uses mixed-case filenames (e.g. "DoSI").
// This map converts lowercase keys to the proper casing for URL construction.

const SOURCE_CASING: Record<string, string> = {
  "aag": "AAG", "aatm": "AATM", "ai": "AI",
  "aitfr-avt": "AitFR-AVT", "aitfr-dn": "AitFR-DN", "aitfr-fcd": "AitFR-FCD",
  "aitfr-isf": "AitFR-ISF", "aitfr-thp": "AitFR-THP",
  "azfyt": "AZfyT", "bam": "BAM", "bgdia": "BGDIA", "bgg": "BGG",
  "bmt": "BMT", "bqgt": "BQGT", "cm": "CM", "coa": "CoA", "cos": "CoS",
  "crcotn": "CRCotN", "dc": "DC", "dd": "EGW", "dip": "DIP", "ditlcot": "DitLCoT",
  "dmg": "DMG", "dmtcrg": "BMT", "dod": "DoD", "dosi": "DoSI",
  "drde-acfas": "DrDe", "drde-bd": "DrDe", "drde-bts": "DrDe",
  "drde-das": "DrDe", "drde-dotsc": "DrDe", "drde-fwtvc": "DrDe",
  "drde-sd": "DrDe", "drde-tdon": "DrDe", "drde-tfv": "DrDe",
  "drde-twoo": "DrDe",
  "dsotdq": "DSotDQ", "efr": "EFR", "egw": "EGW", "erlw": "ERLW",
  "fraif": "FRAiF", "fraif-tllol": "FRAiF", "frhof": "FRHoF",
  "fs": "EGW", "ftd": "FTD", "ggr": "GGR", "gos": "GoS", "gotsf": "GotSF",
  "hat-tg": "TG", "hbtd": "HBTD", "hf": "HF", "hffotm": "HFFotM", "hol": "VRGR",
  "hfstcm": "HFStCM", "hftt": "HftT", "hotb": "HotB", "hotdq": "HotDQ",
  "idrotf": "IDRotF", "imr": "IMR", "jttrc": "JttRC", "kftgv": "KftGV",
  "kkw": "KKW", "lk": "LK", "llk": "LLK", "lmop": "LMoP", "lox": "LoX",
  "lr": "LR", "lrdt": "LRDT", "mabjov": "MaBJoV", "mcv4ec": "MCV4EC",
  "mm": "MM", "mot": "MOT", "mot-nss": "MOT", "mpmm": "MPMM", "mpp": "MPP",
  "mtf": "MTF",
  "nrh-ass": "NRH-ASS", "nrh-at": "NRH-AT", "nrh-avitw": "NRH-AVitW",
  "nrh-awol": "NRH-AWoL", "nrh-coi": "NRH-CoI", "nrh-tcmc": "NRH-TCMC",
  "nrh-tlt": "NRH-TLT",
  "oga": "OGA", "oota": "OotA", "oow": "OoW", "pabtso": "PaBTSO",
  "paf": "PaF", "phb": "PHB", "pip": "PiP", "pota": "PotA",
  "ps-a": "PSA", "ps-d": "PSD", "ps-i": "PSI", "ps-k": "PSK",
  "ps-x": "PSX", "ps-z": "PSZ",
  "qftis": "QftIS", "rmbre": "RMBRE", "rmr": "RMR", "rot": "RoT",
  "rtg": "RtG", "sato": "SatO", "scag": "SCAG", "scc": "SCC",
  "scc-arir": "SCC", "scc-ck": "SCC", "scc-hfmt": "SCC", "scc-tmm": "SCC",
  "scoee": "ScoEE", "screendungeonkit": "ScreenDungeonKit",
  "screenspelljammer": "AAG", "sdw": "SDW", "sja": "SjA", "skt": "SKT",
  "slw": "SLW", "tce": "TCE", "td": "TD", "tdcsr": "TDCSR",
  "tftyp-atg": "TftYP", "tftyp-dit": "TftYP", "tftyp-tfof": "TftYP",
  "tftyp-thsot": "TftYP", "tftyp-toh": "TftYP", "tftyp-tsc": "TftYP",
  "tftyp-wpm": "TftYP",
  "tlk": "TLK", "toa": "ToA", "tofw": "ToFW", "tor": "EGW", "ttp": "TTP",
  "us": "EGW", "uthftlh": "UtHftLH", "veor": "VEoR", "vgm": "VGM", "vnotee": "VNotEE",
  "vrgr": "VRGR", "wbtw": "WBtW", "wdh": "WDH", "wdmm": "WDMM",
  "wtthc": "WttHC", "xdmg": "XDMG", "xge": "XGE", "xmm": "XMM",
  "xmts": "XMtS", "xphb": "XPHB", "xscreen": "XScreen",
};

/** Resolve a lowercase source key to its proper-cased 5etools form. */
export function resolveSourceCasing(source: string): string {
  return SOURCE_CASING[source.toLowerCase()] ?? source;
}

/**
 * Generic image URL builder for the 5etools-img repository.
 *
 * @param type  - Image category folder (e.g. "bestiary", "items", "spells")
 * @param source - Source book abbreviation (e.g. "MM", "PHB")
 * @param name  - Entity name or filename (spaces and special chars are encoded)
 */
export function get5eToolsImageUrl(
  type: string,
  source: string,
  name: string,
): string {
  const encodedName = encodeURIComponent(name);
  return `${BASE_URL}/${type}/${source}/${encodedName}.webp`;
}

/** Monster / creature image URL. */
export function getMonsterImageUrl(name: string, source: string): string {
  return get5eToolsImageUrl("bestiary", source, name);
}

/** Monster token image URL (small circular portrait). */
export function getMonsterTokenUrl(name: string, source: string): string {
  const encodedName = encodeURIComponent(name);
  return `${BASE_URL}/bestiary/tokens/${source}/${encodedName}.webp`;
}

/** Item image URL. */
export function getItemImageUrl(name: string, source: string): string {
  return get5eToolsImageUrl("items", source, name);
}

/** Spell image URL. */
export function getSpellImageUrl(name: string, source: string): string {
  return get5eToolsImageUrl("spells", source, name);
}

/** Vehicle image URL. */
export function getVehicleImageUrl(name: string, source: string): string {
  return get5eToolsImageUrl("vehicles", source, name);
}

/** Vehicle token image URL. */
export function getVehicleTokenUrl(name: string, source: string): string {
  const encodedName = encodeURIComponent(name);
  return `${BASE_URL}/vehicles/tokens/${source}/${encodedName}.webp`;
}

// ---------------------------------------------------------------------------
// Cover image overrides
// ---------------------------------------------------------------------------
// Some adventures don't have their own cover image in the 5etools-img repo.
// Map their source key to the source whose cover image should be used instead.
const COVER_OVERRIDE: Record<string, string> = {
  "ffotr": "EFA",
  "kkw": "GGR",
  "oow": "AI",
  "rmbre": "RMR",
  "efr": "ERLW",
};

/** Book/adventure cover image URL (e.g. covers/DoSI.webp). */
export function getCoverImageUrl(source: string): string {
  const override = COVER_OVERRIDE[source.toLowerCase()];
  if (override) return `${BASE_URL}/covers/${override}.webp`;
  const properSource = resolveSourceCasing(source);
  return `${BASE_URL}/covers/${properSource}.webp`;
}

/**
 * Build a full image URL from the internal `href.path` found in adventure/book
 * JSON data (e.g. "adventure/CoS/000-cos01-01.webp").
 */
export function getInternalImageUrl(path: string): string {
  return `${BASE_URL}/${path}`;
}
