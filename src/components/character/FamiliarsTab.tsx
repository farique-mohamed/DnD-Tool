import { useState } from "react";
import { api } from "@/utils/api";
import { type CharacterData } from "./shared";
import { findMonsterData, MonsterStatBlock } from "@/components/adventure/MonsterStatBlock";

const GOLD = "#c9a84c";
const GOLD_MUTED = "#a89060";
const GOLD_BRIGHT = "#e8d5a3";
const SERIF = "'EB Garamond', 'Georgia', serif";

type Familiar = {
  id: string;
  monsterName: string;
  monsterSource: string;
  displayName: string;
  notes: string | null;
};

export function FamiliarsTab({ character }: { character: CharacterData }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Find the ACCEPTED adventure player ID
  const adventurePlayerId = character.adventurePlayers?.find(
    (ap) => ap.status === "ACCEPTED",
  )?.id;

  const { data: familiars = [], isLoading } =
    api.adventure.getFamiliars.useQuery(
      { adventurePlayerId: adventurePlayerId ?? "" },
      { enabled: !!adventurePlayerId },
    );

  const typedFamiliars = familiars as unknown as Familiar[];

  if (!adventurePlayerId) {
    return (
      <p
        style={{
          color: GOLD_MUTED,
          fontSize: "13px",
          fontFamily: SERIF,
          fontStyle: "italic",
          textAlign: "center",
          padding: "20px",
        }}
      >
        Join an adventure to see your familiars.
      </p>
    );
  }

  if (isLoading) {
    return (
      <p style={{ color: GOLD_MUTED, fontSize: "13px", fontFamily: SERIF }}>
        Loading familiars...
      </p>
    );
  }

  if (typedFamiliars.length === 0) {
    return (
      <div
        style={{
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(201,168,76,0.2)",
          borderRadius: "12px",
          padding: "32px 20px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: GOLD_MUTED,
            fontSize: "14px",
            fontFamily: SERIF,
            fontStyle: "italic",
          }}
        >
          No familiars assigned yet.
        </p>
        <p
          style={{
            color: GOLD_MUTED,
            fontSize: "12px",
            fontFamily: SERIF,
            marginTop: "8px",
          }}
        >
          Your DM can assign familiars and companions to you.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {typedFamiliars.map((fam) => {
        const monsterData = findMonsterData(fam.monsterName, fam.monsterSource);
        const isExpanded = expandedId === fam.id;

        return (
          <div
            key={fam.id}
            style={{
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: "12px",
              padding: "14px 18px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
                flexWrap: "wrap",
              }}
              onClick={() => setExpandedId(isExpanded ? null : fam.id)}
            >
              <span
                style={{
                  color: GOLD_BRIGHT,
                  fontSize: "15px",
                  fontFamily: SERIF,
                  fontWeight: "bold",
                }}
              >
                {isExpanded ? "\u25BC" : "\u25B6"} {fam.displayName}
              </span>
              {fam.displayName !== fam.monsterName && (
                <span
                  style={{
                    color: GOLD_MUTED,
                    fontSize: "12px",
                    fontFamily: SERIF,
                    fontStyle: "italic",
                  }}
                >
                  ({fam.monsterName})
                </span>
              )}
              {monsterData && (
                <span
                  style={{
                    color: GOLD_MUTED,
                    fontSize: "11px",
                    fontFamily: SERIF,
                    background: "rgba(201,168,76,0.1)",
                    padding: "2px 8px",
                    borderRadius: "4px",
                  }}
                >
                  {monsterData.size} {monsterData.type}
                </span>
              )}
            </div>

            {/* Notes */}
            {isExpanded && fam.notes && (
              <p
                style={{
                  color: GOLD_MUTED,
                  fontSize: "12px",
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  marginTop: "8px",
                  marginBottom: "4px",
                  padding: "6px 10px",
                  background: "rgba(201,168,76,0.05)",
                  borderRadius: "6px",
                  border: "1px solid rgba(201,168,76,0.1)",
                }}
              >
                {fam.notes}
              </p>
            )}

            {/* Monster stat block */}
            {isExpanded && monsterData && (
              <MonsterStatBlock monsterData={monsterData} />
            )}

            {isExpanded && !monsterData && (
              <p
                style={{
                  color: GOLD_MUTED,
                  fontSize: "12px",
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  marginTop: "8px",
                }}
              >
                Monster data not found in bestiary.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
