import { useState, useCallback } from "react";
import {
  type NpcData,
  generateRandomNpc,
  pick,
  pickMultiple,
  FIRST_NAMES,
  LAST_NAMES,
  RACES,
  GENDERS,
  ALIGNMENTS,
  OCCUPATIONS,
  LOCATIONS,
  PERSONALITY_TRAITS,
  APPEARANCE_FEATURES,
  VOICE_MANNERISMS,
  BACKGROUNDS,
  MOTIVATIONS,
  SECRETS,
} from "@/lib/npcData";
import {
  GOLD,
  GOLD_MUTED,
  GOLD_BRIGHT,
  SERIF,
} from "./shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NpcGeneratorProps {
  initialNpc?: NpcData;
  onSave: (npc: NpcData) => void;
  onCancel?: () => void;
}

type LockableField =
  | "name"
  | "race"
  | "gender"
  | "alignment"
  | "occupation"
  | "location"
  | "personalityTraits"
  | "appearance"
  | "voiceMannerism"
  | "background"
  | "motivation"
  | "secret";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const inputStyle: React.CSSProperties = {
  background: "rgba(30,15,5,0.9)",
  border: "1px solid rgba(201,168,76,0.4)",
  borderRadius: "6px",
  color: GOLD_BRIGHT,
  fontFamily: SERIF,
  fontSize: "14px",
  padding: "8px 12px",
  outline: "none",
  boxSizing: "border-box",
  width: "100%",
};

const lockedInputStyle: React.CSSProperties = {
  ...inputStyle,
  border: "1px solid rgba(201,168,76,0.7)",
  background: "rgba(201,168,76,0.08)",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: "60px",
  resize: "vertical" as const,
};

const lockedTextareaStyle: React.CSSProperties = {
  ...textareaStyle,
  border: "1px solid rgba(201,168,76,0.7)",
  background: "rgba(201,168,76,0.08)",
};

const labelStyle: React.CSSProperties = {
  color: GOLD_MUTED,
  fontFamily: SERIF,
  fontSize: "12px",
  fontWeight: "bold",
  letterSpacing: "1px",
  textTransform: "uppercase",
  marginBottom: "4px",
  display: "block",
};

const lockBtnStyle: React.CSSProperties = {
  background: "none",
  border: "1px solid rgba(201,168,76,0.3)",
  borderRadius: "4px",
  color: GOLD_MUTED,
  cursor: "pointer",
  fontSize: "14px",
  padding: "4px 6px",
  lineHeight: 1,
  flexShrink: 0,
};

const lockBtnActiveStyle: React.CSSProperties = {
  ...lockBtnStyle,
  background: "rgba(201,168,76,0.15)",
  border: "1px solid rgba(201,168,76,0.6)",
  color: GOLD,
};

const buttonPrimaryStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #8b6914, #c9a84c)",
  color: "#1a1a2e",
  border: "none",
  borderRadius: "6px",
  padding: "10px 24px",
  fontSize: "14px",
  fontFamily: SERIF,
  fontWeight: "bold",
  cursor: "pointer",
  letterSpacing: "0.5px",
};

const buttonSecondaryStyle: React.CSSProperties = {
  background: "none",
  color: GOLD_MUTED,
  border: "1px solid rgba(201,168,76,0.3)",
  borderRadius: "6px",
  padding: "10px 24px",
  fontSize: "14px",
  fontFamily: SERIF,
  fontWeight: "bold",
  cursor: "pointer",
  letterSpacing: "0.5px",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NpcGenerator({ initialNpc, onSave, onCancel }: NpcGeneratorProps) {
  const [npc, setNpc] = useState<NpcData>(initialNpc ?? generateRandomNpc);
  const [locks, setLocks] = useState<Record<LockableField, boolean>>({
    name: !!initialNpc,
    race: !!initialNpc,
    gender: !!initialNpc,
    alignment: !!initialNpc,
    occupation: !!initialNpc,
    location: !!initialNpc,
    personalityTraits: !!initialNpc,
    appearance: !!initialNpc,
    voiceMannerism: !!initialNpc,
    background: !!initialNpc,
    motivation: !!initialNpc,
    secret: !!initialNpc,
  });

  const toggleLock = useCallback((field: LockableField) => {
    setLocks((prev) => ({ ...prev, [field]: !prev[field] }));
  }, []);

  const updateField = useCallback(<K extends keyof NpcData>(field: K, value: NpcData[K]) => {
    setNpc((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleRegenerate = useCallback(() => {
    const fresh = generateRandomNpc();
    setNpc((prev) => {
      const next = { ...prev };
      if (!locks.name) next.name = fresh.name;
      if (!locks.race) next.race = fresh.race;
      if (!locks.gender) next.gender = fresh.gender;
      if (!locks.alignment) next.alignment = fresh.alignment;
      if (!locks.occupation) next.occupation = fresh.occupation;
      if (!locks.location) next.location = fresh.location;
      if (!locks.personalityTraits) next.personalityTraits = fresh.personalityTraits;
      if (!locks.appearance) next.appearance = fresh.appearance;
      if (!locks.voiceMannerism) next.voiceMannerism = fresh.voiceMannerism;
      if (!locks.background) next.background = fresh.background;
      if (!locks.motivation) next.motivation = fresh.motivation;
      if (!locks.secret) next.secret = fresh.secret;
      // notes are never randomized
      return next;
    });
  }, [locks]);

  const handleRandomizeField = useCallback((field: LockableField) => {
    setNpc((prev) => {
      const next = { ...prev };
      switch (field) {
        case "name":
          next.name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
          break;
        case "race":
          next.race = pick(RACES);
          break;
        case "gender":
          next.gender = pick(GENDERS);
          break;
        case "alignment":
          next.alignment = pick(ALIGNMENTS);
          break;
        case "occupation":
          next.occupation = pick(OCCUPATIONS);
          break;
        case "location":
          next.location = pick(LOCATIONS);
          break;
        case "personalityTraits":
          next.personalityTraits = pickMultiple(PERSONALITY_TRAITS, 2 + Math.floor(Math.random() * 2));
          break;
        case "appearance":
          next.appearance = pick(APPEARANCE_FEATURES);
          break;
        case "voiceMannerism":
          next.voiceMannerism = pick(VOICE_MANNERISMS);
          break;
        case "background":
          next.background = pick(BACKGROUNDS);
          break;
        case "motivation":
          next.motivation = pick(MOTIVATIONS);
          break;
        case "secret":
          next.secret = pick(SECRETS);
          break;
      }
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    onSave(npc);
  }, [npc, onSave]);

  // Trait management
  const addTrait = useCallback(() => {
    setNpc((prev) => ({
      ...prev,
      personalityTraits: [...prev.personalityTraits, ""],
    }));
  }, []);

  const removeTrait = useCallback((index: number) => {
    setNpc((prev) => ({
      ...prev,
      personalityTraits: prev.personalityTraits.filter((_, i) => i !== index),
    }));
  }, []);

  const updateTrait = useCallback((index: number, value: string) => {
    setNpc((prev) => ({
      ...prev,
      personalityTraits: prev.personalityTraits.map((t, i) => (i === index ? value : t)),
    }));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Top action buttons */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={handleRegenerate} style={buttonPrimaryStyle}>
          Generate Random NPC
        </button>
        <button onClick={handleSave} style={buttonPrimaryStyle}>
          Save to Adventure
        </button>
        {onCancel && (
          <button onClick={onCancel} style={buttonSecondaryStyle}>
            Cancel
          </button>
        )}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginLeft: "auto",
            cursor: "pointer",
            color: npc.isVisible ? "#4a8c3f" : GOLD_MUTED,
            fontFamily: SERIF,
            fontSize: "13px",
            fontWeight: "bold",
          }}
        >
          <input
            type="checkbox"
            checked={npc.isVisible}
            onChange={(e) => updateField("isVisible", e.target.checked)}
            style={{ cursor: "pointer", accentColor: "#4a8c3f" }}
          />
          Visible to Players
        </label>
      </div>

      {/* Name */}
      <FieldRow
        label="Name"
        locked={locks.name}
        onToggleLock={() => toggleLock("name")}
        onRandomize={() => handleRandomizeField("name")}
      >
        <input
          type="text"
          value={npc.name}
          onChange={(e) => updateField("name", e.target.value)}
          style={locks.name ? lockedInputStyle : inputStyle}
        />
      </FieldRow>

      {/* Race / Gender row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <FieldRow
          label="Race"
          locked={locks.race}
          onToggleLock={() => toggleLock("race")}
          onRandomize={() => handleRandomizeField("race")}
        >
          <input
            type="text"
            value={npc.race}
            onChange={(e) => updateField("race", e.target.value)}
            style={locks.race ? lockedInputStyle : inputStyle}
          />
        </FieldRow>
        <FieldRow
          label="Gender"
          locked={locks.gender}
          onToggleLock={() => toggleLock("gender")}
          onRandomize={() => handleRandomizeField("gender")}
        >
          <input
            type="text"
            value={npc.gender}
            onChange={(e) => updateField("gender", e.target.value)}
            style={locks.gender ? lockedInputStyle : inputStyle}
          />
        </FieldRow>
      </div>

      {/* Alignment / Occupation row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <FieldRow
          label="Alignment"
          locked={locks.alignment}
          onToggleLock={() => toggleLock("alignment")}
          onRandomize={() => handleRandomizeField("alignment")}
        >
          <input
            type="text"
            value={npc.alignment}
            onChange={(e) => updateField("alignment", e.target.value)}
            style={locks.alignment ? lockedInputStyle : inputStyle}
          />
        </FieldRow>
        <FieldRow
          label="Occupation"
          locked={locks.occupation}
          onToggleLock={() => toggleLock("occupation")}
          onRandomize={() => handleRandomizeField("occupation")}
        >
          <input
            type="text"
            value={npc.occupation}
            onChange={(e) => updateField("occupation", e.target.value)}
            style={locks.occupation ? lockedInputStyle : inputStyle}
          />
        </FieldRow>
      </div>

      {/* Location */}
      <FieldRow
        label="Location"
        locked={locks.location}
        onToggleLock={() => toggleLock("location")}
        onRandomize={() => handleRandomizeField("location")}
      >
        <input
          type="text"
          value={npc.location}
          onChange={(e) => updateField("location", e.target.value)}
          style={locks.location ? lockedInputStyle : inputStyle}
          placeholder="Where can this NPC be found..."
        />
      </FieldRow>

      {/* Personality Traits */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <span style={labelStyle}>Personality Traits</span>
          <button
            onClick={() => toggleLock("personalityTraits")}
            style={locks.personalityTraits ? lockBtnActiveStyle : lockBtnStyle}
            title={locks.personalityTraits ? "Unlock (will randomize)" : "Lock (keep on regenerate)"}
          >
            {locks.personalityTraits ? "\uD83D\uDD12" : "\uD83D\uDD13"}
          </button>
          <button
            onClick={() => handleRandomizeField("personalityTraits")}
            style={{ ...lockBtnStyle, fontSize: "12px" }}
            title="Randomize this field"
          >
            {"\u2684"}
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {npc.personalityTraits.map((trait, i) => (
            <div key={i} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <input
                type="text"
                value={trait}
                onChange={(e) => updateTrait(i, e.target.value)}
                style={{ ...(locks.personalityTraits ? lockedInputStyle : inputStyle), flex: 1 }}
                placeholder="Enter a personality trait..."
              />
              <button
                onClick={() => removeTrait(i)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#e74c3c",
                  fontSize: "16px",
                  cursor: "pointer",
                  padding: "4px 8px",
                  fontFamily: SERIF,
                  flexShrink: 0,
                }}
                title="Remove trait"
              >
                x
              </button>
            </div>
          ))}
          <button
            onClick={addTrait}
            style={{
              ...buttonSecondaryStyle,
              padding: "6px 16px",
              fontSize: "12px",
              alignSelf: "flex-start",
            }}
          >
            + Add Trait
          </button>
        </div>
      </div>

      {/* Appearance */}
      <FieldRow
        label="Appearance"
        locked={locks.appearance}
        onToggleLock={() => toggleLock("appearance")}
        onRandomize={() => handleRandomizeField("appearance")}
      >
        <textarea
          value={npc.appearance}
          onChange={(e) => updateField("appearance", e.target.value)}
          style={locks.appearance ? lockedTextareaStyle : textareaStyle}
        />
      </FieldRow>

      {/* Voice & Mannerism */}
      <FieldRow
        label="Voice & Mannerism"
        locked={locks.voiceMannerism}
        onToggleLock={() => toggleLock("voiceMannerism")}
        onRandomize={() => handleRandomizeField("voiceMannerism")}
      >
        <textarea
          value={npc.voiceMannerism}
          onChange={(e) => updateField("voiceMannerism", e.target.value)}
          style={locks.voiceMannerism ? lockedTextareaStyle : textareaStyle}
        />
      </FieldRow>

      {/* Background */}
      <FieldRow
        label="Background"
        locked={locks.background}
        onToggleLock={() => toggleLock("background")}
        onRandomize={() => handleRandomizeField("background")}
      >
        <textarea
          value={npc.background}
          onChange={(e) => updateField("background", e.target.value)}
          style={locks.background ? lockedTextareaStyle : textareaStyle}
        />
      </FieldRow>

      {/* Motivation */}
      <FieldRow
        label="Motivation"
        locked={locks.motivation}
        onToggleLock={() => toggleLock("motivation")}
        onRandomize={() => handleRandomizeField("motivation")}
      >
        <textarea
          value={npc.motivation}
          onChange={(e) => updateField("motivation", e.target.value)}
          style={locks.motivation ? lockedTextareaStyle : textareaStyle}
        />
      </FieldRow>

      {/* Secret */}
      <FieldRow
        label="Secret"
        locked={locks.secret}
        onToggleLock={() => toggleLock("secret")}
        onRandomize={() => handleRandomizeField("secret")}
        isSecret
      >
        <textarea
          value={npc.secret}
          onChange={(e) => updateField("secret", e.target.value)}
          style={{
            ...(locks.secret ? lockedTextareaStyle : textareaStyle),
            borderColor: "rgba(231,76,60,0.5)",
          }}
        />
      </FieldRow>

      {/* Notes (no lock, no randomize) */}
      <div>
        <span style={labelStyle}>Notes</span>
        <textarea
          value={npc.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          style={textareaStyle}
          placeholder="Free-text DM notes..."
        />
      </div>

      {/* Bottom action buttons */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button onClick={handleRegenerate} style={buttonPrimaryStyle}>
          Generate Random NPC
        </button>
        <button onClick={handleSave} style={buttonPrimaryStyle}>
          Save to Adventure
        </button>
        {onCancel && (
          <button onClick={onCancel} style={buttonSecondaryStyle}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FieldRow — wraps a single field with label, lock, and randomize button
// ---------------------------------------------------------------------------

function FieldRow({
  label,
  locked,
  onToggleLock,
  onRandomize,
  isSecret,
  children,
}: {
  label: string;
  locked: boolean;
  onToggleLock: () => void;
  onRandomize: () => void;
  isSecret?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={
        isSecret
          ? {
              border: "1px solid rgba(231,76,60,0.3)",
              borderRadius: "6px",
              padding: "10px",
              background: "rgba(231,76,60,0.05)",
            }
          : undefined
      }
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
        <span style={{ ...labelStyle, marginBottom: 0, color: isSecret ? "#e74c3c" : GOLD_MUTED }}>
          {label}
          {isSecret && (
            <span style={{ fontSize: "10px", fontWeight: "normal", marginLeft: "6px", opacity: 0.8 }}>
              (DM only)
            </span>
          )}
        </span>
        <button
          onClick={onToggleLock}
          style={locked ? lockBtnActiveStyle : lockBtnStyle}
          title={locked ? "Unlock (will randomize)" : "Lock (keep on regenerate)"}
        >
          {locked ? "\uD83D\uDD12" : "\uD83D\uDD13"}
        </button>
        <button
          onClick={onRandomize}
          style={{ ...lockBtnStyle, fontSize: "12px" }}
          title="Randomize this field"
        >
          {"\u2684"}
        </button>
      </div>
      {children}
    </div>
  );
}
