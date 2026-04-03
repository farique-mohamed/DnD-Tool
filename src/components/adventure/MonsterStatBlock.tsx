import { MONSTER_LIST, type MonsterInfo, abilityMod } from "@/lib/bestiaryData";
import { parseTaggedText } from "@/lib/dndTagParser";
import { GOLD, GOLD_MUTED, GOLD_BRIGHT, TEXT_DIM, SERIF } from "./shared";

// ---------------------------------------------------------------------------
// Monster lookup helper
// ---------------------------------------------------------------------------

export function findMonsterData(
  name: string | null | undefined,
  source: string | null | undefined,
): MonsterInfo | undefined {
  if (!name) return undefined;
  // Exact name match
  const byName = MONSTER_LIST.find(
    (m) => m.name.toLowerCase() === name.toLowerCase(),
  );
  if (byName) return byName;
  // Name + source match
  if (source) {
    const byNameSource = MONSTER_LIST.find(
      (m) =>
        m.name.toLowerCase() === name.toLowerCase() &&
        m.source.toLowerCase() === source.toLowerCase(),
    );
    if (byNameSource) return byNameSource;
    // Try source-only match (monsterSource may store the bestiary name)
    const bySource = MONSTER_LIST.find(
      (m) =>
        m.source.toLowerCase() === source.toLowerCase() &&
        m.name.toLowerCase() === name.toLowerCase(),
    );
    if (bySource) return bySource;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Monster stat block renderer
// ---------------------------------------------------------------------------

export function MonsterStatBlock({
  monsterData,
}: {
  monsterData: MonsterInfo;
}) {
  return (
    <div
      style={{
        background: "rgba(0,0,0,0.3)",
        border: "1px solid rgba(201,168,76,0.15)",
        borderRadius: "8px",
        padding: "16px 20px",
        marginTop: "8px",
        marginBottom: "4px",
      }}
    >
      {/* Size, type, alignment */}
      <p
        style={{
          color: GOLD_MUTED,
          fontSize: "13px",
          fontFamily: SERIF,
          fontStyle: "italic",
          marginBottom: "8px",
        }}
      >
        {monsterData.size} {monsterData.type}
        {monsterData.alignment ? `, ${monsterData.alignment}` : ""}
      </p>

      {/* AC, HP, Speed */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          marginBottom: "12px",
          fontSize: "13px",
          fontFamily: SERIF,
        }}
      >
        <div>
          <span style={{ color: GOLD, fontWeight: "bold" }}>Armor Class </span>
          <span style={{ color: GOLD_BRIGHT }}>
            {monsterData.ac ?? "\u2014"}
            {monsterData.acNote ? ` (${monsterData.acNote})` : ""}
          </span>
        </div>
        <div>
          <span style={{ color: GOLD, fontWeight: "bold" }}>Hit Points </span>
          <span style={{ color: GOLD_BRIGHT }}>
            {monsterData.hp ?? "\u2014"}
            {monsterData.hpFormula ? ` (${monsterData.hpFormula})` : ""}
          </span>
        </div>
        <div>
          <span style={{ color: GOLD, fontWeight: "bold" }}>Speed </span>
          <span style={{ color: GOLD_BRIGHT }}>
            {monsterData.speed || "\u2014"}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          height: "1px",
          background: "rgba(201,168,76,0.2)",
          margin: "8px 0",
        }}
      />

      {/* Ability scores */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: "8px",
          textAlign: "center",
          marginBottom: "12px",
        }}
      >
        {(["str", "dex", "con", "int", "wis", "cha"] as const).map((ab) => (
          <div key={ab}>
            <div
              style={{
                color: GOLD,
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              {ab}
            </div>
            <div
              style={{
                color: GOLD_BRIGHT,
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              {monsterData[ab]}
            </div>
            <div style={{ color: TEXT_DIM, fontSize: "11px" }}>
              ({abilityMod(monsterData[ab])})
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div
        style={{
          height: "1px",
          background: "rgba(201,168,76,0.2)",
          margin: "8px 0",
        }}
      />

      {/* Secondary stats */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          marginBottom: "12px",
          fontSize: "13px",
          fontFamily: SERIF,
        }}
      >
        {monsterData.savingThrows && (
          <div>
            <span style={{ color: GOLD, fontWeight: "bold" }}>
              Saving Throws{" "}
            </span>
            <span style={{ color: GOLD_BRIGHT }}>
              {monsterData.savingThrows}
            </span>
          </div>
        )}
        {monsterData.skills && (
          <div>
            <span style={{ color: GOLD, fontWeight: "bold" }}>Skills </span>
            <span style={{ color: GOLD_BRIGHT }}>{monsterData.skills}</span>
          </div>
        )}
        {monsterData.damageResistances && (
          <div>
            <span style={{ color: GOLD, fontWeight: "bold" }}>
              Damage Resistances{" "}
            </span>
            <span style={{ color: GOLD_BRIGHT }}>
              {monsterData.damageResistances}
            </span>
          </div>
        )}
        {monsterData.damageImmunities && (
          <div>
            <span style={{ color: GOLD, fontWeight: "bold" }}>
              Damage Immunities{" "}
            </span>
            <span style={{ color: GOLD_BRIGHT }}>
              {monsterData.damageImmunities}
            </span>
          </div>
        )}
        {monsterData.conditionImmunities && (
          <div>
            <span style={{ color: GOLD, fontWeight: "bold" }}>
              Condition Immunities{" "}
            </span>
            <span style={{ color: GOLD_BRIGHT }}>
              {monsterData.conditionImmunities}
            </span>
          </div>
        )}
        {monsterData.senses && (
          <div>
            <span style={{ color: GOLD, fontWeight: "bold" }}>Senses </span>
            <span style={{ color: GOLD_BRIGHT }}>{monsterData.senses}</span>
          </div>
        )}
        {monsterData.languages && (
          <div>
            <span style={{ color: GOLD, fontWeight: "bold" }}>Languages </span>
            <span style={{ color: GOLD_BRIGHT }}>{monsterData.languages}</span>
          </div>
        )}
      </div>

      {/* Traits */}
      {monsterData.traits.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          {monsterData.traits.map((t, ti) => (
            <div key={ti} style={{ marginBottom: "6px" }}>
              <span
                style={{
                  color: GOLD_BRIGHT,
                  fontWeight: "bold",
                  fontStyle: "italic",
                  fontFamily: SERIF,
                  fontSize: "13px",
                }}
              >
                {t.name}.{" "}
              </span>
              <span
                style={{
                  color: GOLD_BRIGHT,
                  fontFamily: SERIF,
                  fontSize: "13px",
                }}
                dangerouslySetInnerHTML={{ __html: parseTaggedText(t.text) }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {monsterData.actions.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <h4
            style={{
              color: GOLD,
              fontSize: "14px",
              fontFamily: SERIF,
              fontWeight: "bold",
              borderBottom: "1px solid rgba(201,168,76,0.3)",
              paddingBottom: "4px",
              marginBottom: "8px",
            }}
          >
            Actions
          </h4>
          {monsterData.actions.map((a, ai) => (
            <div key={ai} style={{ marginBottom: "6px" }}>
              <span
                style={{
                  color: GOLD_BRIGHT,
                  fontWeight: "bold",
                  fontStyle: "italic",
                  fontFamily: SERIF,
                  fontSize: "13px",
                }}
              >
                {a.name}.{" "}
              </span>
              <span
                style={{
                  color: GOLD_BRIGHT,
                  fontFamily: SERIF,
                  fontSize: "13px",
                }}
                dangerouslySetInnerHTML={{ __html: parseTaggedText(a.text) }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Bonus Actions */}
      {monsterData.bonusActions.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <h4
            style={{
              color: GOLD,
              fontSize: "14px",
              fontFamily: SERIF,
              fontWeight: "bold",
              borderBottom: "1px solid rgba(201,168,76,0.3)",
              paddingBottom: "4px",
              marginBottom: "8px",
            }}
          >
            Bonus Actions
          </h4>
          {monsterData.bonusActions.map((a, ai) => (
            <div key={ai} style={{ marginBottom: "6px" }}>
              <span
                style={{
                  color: GOLD_BRIGHT,
                  fontWeight: "bold",
                  fontStyle: "italic",
                  fontFamily: SERIF,
                  fontSize: "13px",
                }}
              >
                {a.name}.{" "}
              </span>
              <span
                style={{
                  color: GOLD_BRIGHT,
                  fontFamily: SERIF,
                  fontSize: "13px",
                }}
                dangerouslySetInnerHTML={{ __html: parseTaggedText(a.text) }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Reactions */}
      {monsterData.reactions.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <h4
            style={{
              color: GOLD,
              fontSize: "14px",
              fontFamily: SERIF,
              fontWeight: "bold",
              borderBottom: "1px solid rgba(201,168,76,0.3)",
              paddingBottom: "4px",
              marginBottom: "8px",
            }}
          >
            Reactions
          </h4>
          {monsterData.reactions.map((a, ai) => (
            <div key={ai} style={{ marginBottom: "6px" }}>
              <span
                style={{
                  color: GOLD_BRIGHT,
                  fontWeight: "bold",
                  fontStyle: "italic",
                  fontFamily: SERIF,
                  fontSize: "13px",
                }}
              >
                {a.name}.{" "}
              </span>
              <span
                style={{
                  color: GOLD_BRIGHT,
                  fontFamily: SERIF,
                  fontSize: "13px",
                }}
                dangerouslySetInnerHTML={{ __html: parseTaggedText(a.text) }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Legendary Actions */}
      {monsterData.legendaryActions.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <h4
            style={{
              color: GOLD,
              fontSize: "14px",
              fontFamily: SERIF,
              fontWeight: "bold",
              borderBottom: "1px solid rgba(201,168,76,0.3)",
              paddingBottom: "4px",
              marginBottom: "8px",
            }}
          >
            Legendary Actions
          </h4>
          {monsterData.legendaryActions.map((a, ai) => (
            <div key={ai} style={{ marginBottom: "6px" }}>
              <span
                style={{
                  color: GOLD_BRIGHT,
                  fontWeight: "bold",
                  fontStyle: "italic",
                  fontFamily: SERIF,
                  fontSize: "13px",
                }}
              >
                {a.name}.{" "}
              </span>
              <span
                style={{
                  color: GOLD_BRIGHT,
                  fontFamily: SERIF,
                  fontSize: "13px",
                }}
                dangerouslySetInnerHTML={{ __html: parseTaggedText(a.text) }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
