// ---------------------------------------------------------------------------
// Character PDF Export — generates a D&D-styled character sheet PDF
// ---------------------------------------------------------------------------

import { jsPDF } from "jspdf";

// ---------------------------------------------------------------------------
// Theme colors (matching the app's D&D gold/brown palette)
// ---------------------------------------------------------------------------

const GOLD = "#c9a84c";
const GOLD_DARK = "#8b6914";
const GOLD_MUTED = "#a89060";
const DARK_BG = "#1a1a2e";
const TEXT_LIGHT = "#e8d5a3";
const SERIF_FONT = "times"; // jsPDF built-in serif

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function abilityModifier(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function proficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

function safeParseJsonArray(str: string | undefined | null): string[] {
  if (!str) return [];
  try {
    const parsed: unknown = JSON.parse(str);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// PDF Generation
// ---------------------------------------------------------------------------

export interface CharacterExportData {
  name: string;
  race: string;
  characterClass: string;
  subclass?: string | null;
  level: number;
  alignment: string;
  background?: string | null;
  maxHp: number;
  currentHp: number;
  tempHp?: number;
  armorClass: number;
  speed: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  skillProficiencies?: string;
  skillExpertise?: string;
  preparedSpells?: string;
  activeConditions?: string;
  activeDiseases?: string;
  feats?: string;
  notes?: string;
  backstory?: string | null;
  languages?: string;
  rulesSource?: string;
}

export function generateCharacterPdf(character: CharacterExportData): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  // ---- Background ----
  doc.setFillColor(DARK_BG);
  doc.rect(0, 0, pageWidth, 297, "F");

  // ---- Top border ----
  doc.setDrawColor(GOLD);
  doc.setLineWidth(1.5);
  doc.rect(8, 8, pageWidth - 16, 281, "S");
  doc.setDrawColor(GOLD_DARK);
  doc.setLineWidth(0.5);
  doc.rect(10, 10, pageWidth - 20, 277, "S");

  // ---- Header ----
  y = 22;
  doc.setFont(SERIF_FONT, "bold");
  doc.setFontSize(24);
  doc.setTextColor(GOLD);
  doc.text(character.name.toUpperCase(), pageWidth / 2, y, { align: "center" });

  y += 8;
  doc.setFont(SERIF_FONT, "normal");
  doc.setFontSize(11);
  doc.setTextColor(GOLD_MUTED);
  const subtitle = [
    `Level ${character.level}`,
    character.race,
    character.characterClass,
    character.subclass ? `(${character.subclass})` : "",
    character.alignment ? `\u2014 ${character.alignment}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  doc.text(subtitle, pageWidth / 2, y, { align: "center" });

  if (character.background) {
    y += 5;
    doc.setFontSize(9);
    doc.text(`Background: ${character.background}`, pageWidth / 2, y, { align: "center" });
  }

  if (character.rulesSource) {
    y += 5;
    doc.setFontSize(8);
    doc.setTextColor(GOLD_DARK);
    doc.text(`Source: ${character.rulesSource === "XPHB" ? "PHB 2024" : "PHB 2014"}`, pageWidth / 2, y, { align: "center" });
  }

  // ---- Divider ----
  y += 6;
  doc.setDrawColor(GOLD);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  // ---- Combat Stats ----
  y += 8;
  const combatStats = [
    { label: "HP", value: `${character.currentHp}/${character.maxHp}${character.tempHp ? ` (+${character.tempHp} temp)` : ""}` },
    { label: "AC", value: `${character.armorClass}` },
    { label: "Speed", value: `${character.speed} ft` },
    { label: "Prof. Bonus", value: `+${proficiencyBonus(character.level)}` },
  ];

  const statBoxWidth = contentWidth / combatStats.length;
  combatStats.forEach((stat, i) => {
    const x = margin + i * statBoxWidth + statBoxWidth / 2;
    doc.setFont(SERIF_FONT, "bold");
    doc.setFontSize(8);
    doc.setTextColor(GOLD_DARK);
    doc.text(stat.label.toUpperCase(), x, y, { align: "center" });
    doc.setFont(SERIF_FONT, "bold");
    doc.setFontSize(14);
    doc.setTextColor(TEXT_LIGHT);
    doc.text(stat.value, x, y + 6, { align: "center" });
  });

  // ---- Ability Scores ----
  y += 16;
  doc.setDrawColor(GOLD_DARK);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  const abilities = [
    { label: "STR", value: character.strength },
    { label: "DEX", value: character.dexterity },
    { label: "CON", value: character.constitution },
    { label: "INT", value: character.intelligence },
    { label: "WIS", value: character.wisdom },
    { label: "CHA", value: character.charisma },
  ];

  const abilBoxWidth = contentWidth / 6;
  abilities.forEach((ab, i) => {
    const x = margin + i * abilBoxWidth + abilBoxWidth / 2;

    // Box
    doc.setFillColor("#0d0d1a");
    doc.setDrawColor(GOLD);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin + i * abilBoxWidth + 2, y - 2, abilBoxWidth - 4, 20, 2, 2, "FD");

    // Label
    doc.setFont(SERIF_FONT, "bold");
    doc.setFontSize(8);
    doc.setTextColor(GOLD);
    doc.text(ab.label, x, y + 3, { align: "center" });

    // Score
    doc.setFont(SERIF_FONT, "bold");
    doc.setFontSize(16);
    doc.setTextColor(TEXT_LIGHT);
    doc.text(`${ab.value}`, x, y + 11, { align: "center" });

    // Modifier
    doc.setFont(SERIF_FONT, "normal");
    doc.setFontSize(9);
    doc.setTextColor(GOLD_MUTED);
    doc.text(abilityModifier(ab.value), x, y + 16, { align: "center" });
  });

  y += 24;

  // ---- Skills ----
  const skills = safeParseJsonArray(character.skillProficiencies);
  const expertise = safeParseJsonArray(character.skillExpertise);

  if (skills.length > 0) {
    y = drawSectionHeader(doc, "Skill Proficiencies", y, margin, pageWidth);
    y += 4;
    doc.setFont(SERIF_FONT, "normal");
    doc.setFontSize(9);
    doc.setTextColor(TEXT_LIGHT);

    const skillTexts = skills.map((s) => {
      const isExpert = expertise.includes(s);
      return isExpert ? `${s} (Expertise)` : s;
    });

    const skillLine = skillTexts.join(", ");
    const lines = doc.splitTextToSize(skillLine, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 4 + 2;
  }

  // ---- Languages ----
  const languages = safeParseJsonArray(character.languages);
  if (languages.length > 0) {
    y = drawSectionHeader(doc, "Languages", y, margin, pageWidth);
    y += 4;
    doc.setFont(SERIF_FONT, "normal");
    doc.setFontSize(9);
    doc.setTextColor(TEXT_LIGHT);
    const langLine = languages.join(", ");
    const lines = doc.splitTextToSize(langLine, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 4 + 2;
  }

  // ---- Feats ----
  const feats = safeParseJsonArray(character.feats);
  if (feats.length > 0) {
    y = drawSectionHeader(doc, "Feats", y, margin, pageWidth);
    y += 4;
    doc.setFont(SERIF_FONT, "normal");
    doc.setFontSize(9);
    doc.setTextColor(TEXT_LIGHT);
    const featLine = feats.join(", ");
    const lines = doc.splitTextToSize(featLine, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 4 + 2;
  }

  // ---- Spells ----
  const spells = safeParseJsonArray(character.preparedSpells);
  if (spells.length > 0) {
    y = drawSectionHeader(doc, "Prepared Spells", y, margin, pageWidth);
    y += 4;
    doc.setFont(SERIF_FONT, "normal");
    doc.setFontSize(9);
    doc.setTextColor(TEXT_LIGHT);
    const spellLine = spells.join(", ");
    const lines = doc.splitTextToSize(spellLine, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 4 + 2;
  }

  // ---- Active Conditions ----
  const conditions = safeParseJsonArray(character.activeConditions);
  if (conditions.length > 0) {
    y = drawSectionHeader(doc, "Active Conditions", y, margin, pageWidth);
    y += 4;
    doc.setFont(SERIF_FONT, "normal");
    doc.setFontSize(9);
    doc.setTextColor("#e74c3c");
    doc.text(conditions.join(", "), margin, y);
    y += 6;
  }

  // ---- Active Diseases ----
  const diseases = safeParseJsonArray(character.activeDiseases);
  if (diseases.length > 0) {
    y = drawSectionHeader(doc, "Active Diseases", y, margin, pageWidth);
    y += 4;
    doc.setFont(SERIF_FONT, "normal");
    doc.setFontSize(9);
    doc.setTextColor("#e74c3c");
    doc.text(diseases.join(", "), margin, y);
    y += 6;
  }

  // ---- Backstory ----
  if (character.backstory) {
    y = checkPageBreak(doc, y, 30, pageWidth);
    y = drawSectionHeader(doc, "Backstory", y, margin, pageWidth);
    y += 4;
    doc.setFont(SERIF_FONT, "normal");
    doc.setFontSize(9);
    doc.setTextColor(TEXT_LIGHT);
    const lines = doc.splitTextToSize(character.backstory, contentWidth);
    for (const line of lines) {
      y = checkPageBreak(doc, y, 6, pageWidth);
      doc.text(line as string, margin, y);
      y += 4;
    }
    y += 2;
  }

  // ---- Notes ----
  if (character.notes) {
    y = checkPageBreak(doc, y, 30, pageWidth);
    y = drawSectionHeader(doc, "Notes", y, margin, pageWidth);
    y += 4;
    doc.setFont(SERIF_FONT, "normal");
    doc.setFontSize(9);
    doc.setTextColor(TEXT_LIGHT);
    const lines = doc.splitTextToSize(character.notes, contentWidth);
    for (const line of lines) {
      y = checkPageBreak(doc, y, 6, pageWidth);
      doc.text(line as string, margin, y);
      y += 4;
    }
  }

  // ---- Footer ----
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont(SERIF_FONT, "italic");
    doc.setFontSize(7);
    doc.setTextColor(GOLD_DARK);
    doc.text(`${character.name} — Generated by DnD Tool`, pageWidth / 2, 292, { align: "center" });
  }

  return doc;
}

// ---------------------------------------------------------------------------
// Internal drawing helpers
// ---------------------------------------------------------------------------

function drawSectionHeader(
  doc: jsPDF,
  title: string,
  y: number,
  margin: number,
  pageWidth: number,
): number {
  y += 4;
  doc.setDrawColor(GOLD_DARK);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;
  doc.setFont(SERIF_FONT, "bold");
  doc.setFontSize(10);
  doc.setTextColor(GOLD);
  doc.text(title.toUpperCase(), margin, y);
  y += 2;
  return y;
}

function checkPageBreak(doc: jsPDF, y: number, needed: number, pageWidth: number): number {
  if (y + needed > 280) {
    doc.addPage();
    // Redraw border on new page
    doc.setFillColor("#1a1a2e");
    doc.rect(0, 0, pageWidth, 297, "F");
    doc.setDrawColor(GOLD);
    doc.setLineWidth(1.5);
    doc.rect(8, 8, pageWidth - 16, 281, "S");
    doc.setDrawColor(GOLD_DARK);
    doc.setLineWidth(0.5);
    doc.rect(10, 10, pageWidth - 20, 277, "S");
    return 20;
  }
  return y;
}

// ---------------------------------------------------------------------------
// Convenience: generate + trigger browser download
// ---------------------------------------------------------------------------

export function downloadCharacterPdf(character: CharacterExportData): void {
  const doc = generateCharacterPdf(character);
  doc.save(`${character.name.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_")}_sheet.pdf`);
}
