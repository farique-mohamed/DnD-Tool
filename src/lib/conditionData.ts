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
// Parse raw data — conditions + statuses (skip diseases)
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

// ---------------------------------------------------------------------------
// De-duplicate by name: keep one per name. When filtering by source we pick
// the matching version; the default export keeps all versions.
// ---------------------------------------------------------------------------

/** All conditions and statuses (both PHB and XPHB versions). */
export const CONDITIONS: Condition[] = [...allConditions, ...allStatuses];

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
