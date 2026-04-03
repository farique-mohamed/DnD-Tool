// ---------------------------------------------------------------------------
// D&D 5e Language data — loaded from data/languages.json
// ---------------------------------------------------------------------------

import rawData from "../../data/languages.json";
import { parseTaggedText } from "@/lib/dndTagParser";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LanguageInfo {
  name: string;
  source: string;
  type: string; // "Standard", "Exotic", "Rare", or "Other"
  typicalSpeakers: string[];
  script?: string;
  origin?: string;
}

interface RawLanguage {
  name: string;
  source: string;
  type?: string;
  typicalSpeakers?: string[];
  script?: string;
  origin?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_MAP: Record<string, string> = {
  standard: "Standard",
  exotic: "Exotic",
  rare: "Rare",
};

/** Sources we prefer when deduplicating — lower index = higher priority */
const PREFERRED_SOURCES = ["XPHB", "PHB"];

function mapType(raw?: string): string {
  return (raw && TYPE_MAP[raw]) ?? "Other";
}

// ---------------------------------------------------------------------------
// Parse & deduplicate
// ---------------------------------------------------------------------------

function parseLanguages(): LanguageInfo[] {
  const entries: LanguageInfo[] = (rawData.language as RawLanguage[]).map((lang) => ({
    name: lang.name,
    source: lang.source,
    type: mapType(lang.type),
    typicalSpeakers: (lang.typicalSpeakers ?? []).map((s) => parseTaggedText(s)),
    script: lang.script,
    origin: lang.origin,
  }));

  // Deduplicate by name, preferring XPHB > PHB > first occurrence
  const byName = new Map<string, LanguageInfo>();
  for (const entry of entries) {
    const existing = byName.get(entry.name);
    if (!existing) {
      byName.set(entry.name, entry);
      continue;
    }
    const existingPriority = PREFERRED_SOURCES.indexOf(existing.source);
    const newPriority = PREFERRED_SOURCES.indexOf(entry.source);
    // If new entry has a preferred source and existing doesn't (or lower index wins)
    if (newPriority !== -1 && (existingPriority === -1 || newPriority < existingPriority)) {
      byName.set(entry.name, entry);
    }
  }

  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const LANGUAGES: LanguageInfo[] = parseLanguages();

export const LANGUAGE_SOURCES: string[] = Array.from(
  new Set(LANGUAGES.map((l) => l.source))
).sort();

export const LANGUAGE_TYPES: string[] = Array.from(
  new Set(LANGUAGES.map((l) => l.type))
).sort();

// ---------------------------------------------------------------------------
// Backward-compatible exports (string[] of names)
// ---------------------------------------------------------------------------

export const STANDARD_LANGUAGES: string[] = LANGUAGES
  .filter((l) => l.type === "Standard")
  .map((l) => l.name);

export const EXOTIC_LANGUAGES: string[] = LANGUAGES
  .filter((l) => l.type === "Exotic")
  .map((l) => l.name);

export const RARE_LANGUAGES: string[] = LANGUAGES
  .filter((l) => l.type === "Rare")
  .map((l) => l.name);

export const ALL_LANGUAGES: string[] = LANGUAGES.map((l) => l.name);
