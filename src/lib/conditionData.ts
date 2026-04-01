// ---------------------------------------------------------------------------
// Condition / Status static data — parsed from 5etools conditionsdiseases.json
// ---------------------------------------------------------------------------

import { parseTaggedText } from "@/lib/dndTagParser";
import rawData from "../../data/conditionsdiseases.json";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Condition {
  name: string;
  source: string;
  entries: string[]; // parsed text descriptions
}

// ---------------------------------------------------------------------------
// Entry flattening — handles strings, list objects, entries objects, and tables
// ---------------------------------------------------------------------------

interface RawEntryObject {
  type?: string;
  name?: string;
  items?: (string | RawEntryObject)[];
  entries?: (string | RawEntryObject)[];
  colLabels?: string[];
  rows?: string[][];
}

type RawEntry = string | RawEntryObject;

function flattenEntries(entries: RawEntry[]): string[] {
  const result: string[] = [];

  for (const entry of entries) {
    if (typeof entry === "string") {
      result.push(entry);
    } else if (entry && typeof entry === "object") {
      if (entry.type === "list" && Array.isArray(entry.items)) {
        for (const item of entry.items) {
          if (typeof item === "string") {
            result.push(item);
          } else {
            result.push(...flattenEntries([item]));
          }
        }
      } else if (entry.type === "table" && Array.isArray(entry.rows)) {
        // Render table rows as "Label1: Value1, Label2: Value2"
        const labels = entry.colLabels ?? [];
        for (const row of entry.rows) {
          const parts = row.map((cell, i) =>
            labels[i] ? `${labels[i]}: ${cell}` : cell,
          );
          result.push(parts.join(", "));
        }
      } else if (entry.type === "entries" && Array.isArray(entry.entries)) {
        if (entry.name) {
          result.push(`${entry.name}.`);
        }
        result.push(...flattenEntries(entry.entries));
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Parse raw data — conditions, statuses, and diseases
// ---------------------------------------------------------------------------

interface RawCondition {
  name: string;
  source: string;
  entries: RawEntry[];
}

function parseConditions(raw: RawCondition[]): Condition[] {
  return raw.map((c) => ({
    name: c.name,
    source: c.source,
    entries: flattenEntries(c.entries).map((text) => parseTaggedText(text)),
  }));
}

const allConditions = parseConditions(rawData.condition as RawCondition[]);
const allStatuses = parseConditions(
  (rawData.status ?? []) as RawCondition[],
);
const allDiseases = parseConditions(
  ((rawData as Record<string, unknown>).disease ?? []) as RawCondition[],
);

// ---------------------------------------------------------------------------
// De-duplicate by name: keep one per name. When filtering by source we pick
// the matching version; the default export keeps all versions.
// ---------------------------------------------------------------------------

/** All conditions and statuses (both PHB and XPHB versions). */
export const CONDITIONS: Condition[] = [...allConditions, ...allStatuses];

/** All diseases from the data file. */
export const DISEASES: Condition[] = allDiseases;

/**
 * Get conditions/statuses for a specific rules source.
 * De-duplicates by name, preferring the version matching the requested source.
 */
export function getConditionsBySource(source: "PHB" | "XPHB"): Condition[] {
  const byName = new Map<string, Condition>();

  for (const c of CONDITIONS) {
    const existing = byName.get(c.name);
    if (!existing) {
      // First time seeing this name — take it regardless of source
      byName.set(c.name, c);
    } else if (c.source === source && existing.source !== source) {
      // Replace with the version matching the requested source
      byName.set(c.name, c);
    }
  }

  return Array.from(byName.values());
}

/**
 * Look up a single condition/status by name, optionally filtered by source.
 */
export function getConditionByName(
  name: string,
  source?: string,
): Condition | undefined {
  if (source) {
    return CONDITIONS.find(
      (c) => c.name === name && c.source === source,
    );
  }
  return CONDITIONS.find((c) => c.name === name);
}

// ---------------------------------------------------------------------------
// Rich detail entries — preserves raw structure for the detail page
// ---------------------------------------------------------------------------

export interface ConditionDetail {
  name: string;
  source: string;
  category: "condition" | "status" | "disease";
  entries: unknown[]; // raw entries for rich rendering
  flatEntries: string[]; // flattened text (existing format)
}

function buildDetails(
  raw: RawCondition[],
  category: "condition" | "status" | "disease",
): ConditionDetail[] {
  return raw.map((c) => ({
    name: c.name,
    source: c.source,
    category,
    entries: c.entries as unknown[],
    flatEntries: flattenEntries(c.entries).map((text) => parseTaggedText(text)),
  }));
}

const allConditionDetails = buildDetails(
  rawData.condition as RawCondition[],
  "condition",
);
const allStatusDetails = buildDetails(
  (rawData.status ?? []) as RawCondition[],
  "status",
);
const allDiseaseDetails = buildDetails(
  ((rawData as Record<string, unknown>).disease ?? []) as RawCondition[],
  "disease",
);

/** Preferred sources — newer reprints are preferred over older ones. */
const PREFERRED_SOURCES = new Set(["XPHB", "XDMG"]);

/**
 * All conditions, statuses, and diseases with category tags.
 * De-duplicated by name, preferring XPHB/XDMG sources over PHB/DMG.
 * Sorted alphabetically by name.
 */
export const ALL_ENTRIES: ConditionDetail[] = (() => {
  const combined = [
    ...allConditionDetails,
    ...allStatusDetails,
    ...allDiseaseDetails,
  ];
  const byName = new Map<string, ConditionDetail>();

  for (const entry of combined) {
    const existing = byName.get(entry.name);
    if (!existing) {
      byName.set(entry.name, entry);
    } else if (
      PREFERRED_SOURCES.has(entry.source) &&
      !PREFERRED_SOURCES.has(existing.source)
    ) {
      byName.set(entry.name, entry);
    }
  }

  return Array.from(byName.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
})();

/** Sorted unique sources across all entries. */
export const CONDITION_SOURCES: string[] = [
  ...new Set(ALL_ENTRIES.map((e) => e.source)),
].sort();
