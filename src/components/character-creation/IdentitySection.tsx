import { getClassByNameAndSource, getClassesBySource } from "@/lib/classData";
import { BACKGROUND_NAMES } from "@/lib/backgroundData";
import {
  CHARACTER_RACES,
  ALIGNMENTS,
  labelStyle,
  inputStyle,
  sectionTitleStyle,
  type FormState,
} from "./shared";
import { useMemo } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";

interface IdentitySectionProps {
  form: FormState;
  isLoading: boolean;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onRulesSourceChange: (source: "PHB" | "XPHB") => void;
}

export function IdentitySection({
  form,
  isLoading,
  onFormChange,
  onRulesSourceChange,
}: IdentitySectionProps) {
  const isMobile = useIsMobile();
  const filteredClasses = useMemo(
    () => getClassesBySource(form.rulesSource),
    [form.rulesSource],
  );

  return (
    <div>
      <p style={sectionTitleStyle}>Identity</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <label style={labelStyle}>Rulebook Edition</label>
          <div style={{ display: "flex", gap: "0" }}>
            {([
              { label: "Player's Handbook (2014)", value: "PHB" as const },
              { label: "Player's Handbook (2024)", value: "XPHB" as const },
            ]).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  if (opt.value !== form.rulesSource) {
                    onRulesSourceChange(opt.value);
                  }
                }}
                disabled={isLoading}
                style={{
                  background: form.rulesSource === opt.value
                    ? "linear-gradient(135deg, #8b6914, #c9a84c)"
                    : "rgba(0,0,0,0.4)",
                  border: form.rulesSource === opt.value
                    ? "1px solid #c9a84c"
                    : "1px solid rgba(201,168,76,0.3)",
                  color: form.rulesSource === opt.value ? "#1a1a2e" : "#a89060",
                  fontWeight: form.rulesSource === opt.value ? "bold" : "normal",
                  padding: "8px 18px",
                  fontSize: "12px",
                  fontFamily: "'Georgia', serif",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  letterSpacing: "0.3px",
                  borderRadius: opt.value === "PHB" ? "6px 0 0 6px" : "0 6px 6px 0",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="name" style={labelStyle}>Character Name</label>
          <input id="name" name="name" type="text" placeholder="Enter a name worthy of legend..." value={form.name} onChange={onFormChange} style={inputStyle} required disabled={isLoading} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px" }}>
          <div>
            <label htmlFor="race" style={labelStyle}>Race</label>
            <select id="race" name="race" value={form.race} onChange={onFormChange} style={{ ...inputStyle, cursor: "pointer" }} required disabled={isLoading}>
              <option value="" disabled>Choose your lineage...</option>
              {CHARACTER_RACES.map((r) => <option key={r} value={r} style={{ background: "#1a1a2e" }}>{r}</option>)}
            </select>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "8px" }}>
              <label htmlFor="characterClass" style={{ ...labelStyle, marginBottom: 0 }}>Class</label>
              <a
                href="/classes"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#a89060", fontSize: "11px", fontFamily: "'Georgia', serif", textDecoration: "none", letterSpacing: "0.3px" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#c9a84c"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#a89060"; }}
              >
                Browse all classes →
              </a>
            </div>
            <select id="characterClass" name="characterClass" value={form.characterClass} onChange={onFormChange} style={{ ...inputStyle, cursor: "pointer" }} required disabled={isLoading}>
              <option value="" disabled>Choose your calling...</option>
              {filteredClasses.map((c) => <option key={c.name} value={c.name} style={{ background: "#1a1a2e" }}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="alignment" style={labelStyle}>Alignment</label>
          <select id="alignment" name="alignment" value={form.alignment} onChange={onFormChange} style={{ ...inputStyle, cursor: "pointer" }} disabled={isLoading}>
            {ALIGNMENTS.map((a) => <option key={a} value={a} style={{ background: "#1a1a2e" }}>{a}</option>)}
          </select>
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "8px" }}>
            <label htmlFor="background" style={{ ...labelStyle, marginBottom: 0 }}>Background</label>
            <a
              href="/backgrounds"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#a89060", fontSize: "11px", fontFamily: "'Georgia', serif", textDecoration: "none", letterSpacing: "0.3px" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#c9a84c"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#a89060"; }}
            >
              Browse all backgrounds →
            </a>
          </div>
          <select id="background" name="background" value={form.background} onChange={onFormChange} style={{ ...inputStyle, cursor: "pointer" }} disabled={isLoading}>
            <option value="">Choose your origins...</option>
            {BACKGROUND_NAMES.map((b) => <option key={b} value={b} style={{ background: "#1a1a2e" }}>{b}</option>)}
          </select>
        </div>
      </div>

      {/* Class info panel */}
      {form.characterClass && (() => {
        const ci = getClassByNameAndSource(form.characterClass, form.rulesSource);
        if (!ci) return null;
        return (
          <div style={{
            background: "rgba(201,168,76,0.06)",
            border: "1px solid rgba(201,168,76,0.25)",
            borderRadius: "8px",
            padding: "16px 18px",
            marginTop: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}>
            <p style={{ color: "#c9a84c", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.2px", fontFamily: "'Georgia', serif", margin: 0 }}>
              {ci.name} — Class Overview
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <span style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "4px", padding: "3px 10px", color: "#e8d5a3", fontSize: "12px", fontFamily: "'Georgia', serif" }}>
                Hit Die: {ci.hitDie}
              </span>
              {ci.savingThrows.length > 0 && (
                <span style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "4px", padding: "3px 10px", color: "#e8d5a3", fontSize: "12px", fontFamily: "'Georgia', serif" }}>
                  Saves: {ci.savingThrows.join(", ")}
                </span>
              )}
            </div>
            {ci.armorProficiencies.length > 0 && (
              <p style={{ margin: 0, color: "#a89060", fontSize: "12px", fontFamily: "'Georgia', serif" }}>
                <span style={{ color: "#c9a84c" }}>Armor:</span>{" "}
                {ci.armorProficiencies.join(", ")}
              </p>
            )}
            {ci.weaponProficiencies.length > 0 && (
              <p style={{ margin: 0, color: "#a89060", fontSize: "12px", fontFamily: "'Georgia', serif" }}>
                <span style={{ color: "#c9a84c" }}>Weapons:</span>{" "}
                {ci.weaponProficiencies.join(", ")}
              </p>
            )}
            {ci.skillChoices.count > 0 && (
              <p style={{ margin: 0, color: "#a89060", fontSize: "12px", fontFamily: "'Georgia', serif" }}>
                <span style={{ color: "#c9a84c" }}>Skills:</span>{" "}
                Choose {ci.skillChoices.count} from{" "}
                {ci.skillChoices.from.length > 0 && ci.skillChoices.from[0] !== "Any skill"
                  ? ci.skillChoices.from.join(", ")
                  : "any skill"}
              </p>
            )}
          </div>
        );
      })()}
    </div>
  );
}
