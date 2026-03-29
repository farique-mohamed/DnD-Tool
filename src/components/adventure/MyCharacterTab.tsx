import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useIsMobile";
import { GOLD, GOLD_MUTED, GOLD_BRIGHT, TEXT_DIM, SERIF } from "./shared";

export function MyCharacterTab({ adventure }: { adventure: { id: string; players: Array<{ userId: string; status: string; character: Record<string, unknown> }> } }) {
  const isMobile = useIsMobile();
  const { user } = useAuth();

  const myPlayerRecord = (adventure.players as Array<{ userId: string; status: string; character: Record<string, unknown> }>).find(
    (p) => p.userId === user?.userId && p.status === "ACCEPTED",
  );
  const myCharacter = myPlayerRecord?.character ?? null;

  if (!myCharacter) {
    return (
      <div
        style={{
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(201,168,76,0.2)",
          borderRadius: "12px",
          padding: "60px 40px",
          textAlign: "center",
        }}
      >
        <p style={{ color: GOLD_MUTED, fontSize: "14px", fontFamily: SERIF }}>
          No character found for this adventure.
        </p>
      </div>
    );
  }

  const name = myCharacter.name as string | undefined;
  const race = myCharacter.race as string | undefined;
  const charClass = myCharacter.characterClass as string | undefined;
  const level = (myCharacter.level as number | undefined) ?? 1;
  const subclass = myCharacter.subclass as string | undefined;
  const alignment = myCharacter.alignment as string | undefined;
  const maxHp = (myCharacter.maxHp as number | undefined) ?? 0;
  const currentHp = (myCharacter.currentHp as number | undefined) ?? 0;
  const tempHp = (myCharacter.tempHp as number | undefined) ?? 0;
  const ac = (myCharacter.armorClass as number | undefined) ?? 10;
  const speed = (myCharacter.speed as number | undefined) ?? 30;
  const str = (myCharacter.strength as number | undefined) ?? 10;
  const dex = (myCharacter.dexterity as number | undefined) ?? 10;
  const con = (myCharacter.constitution as number | undefined) ?? 10;
  const int = (myCharacter.intelligence as number | undefined) ?? 10;
  const wis = (myCharacter.wisdom as number | undefined) ?? 10;
  const cha = (myCharacter.charisma as number | undefined) ?? 10;
  const characterId = myCharacter.id as string;

  const abilityScores = [
    { label: "STR", value: str },
    { label: "DEX", value: dex },
    { label: "CON", value: con },
    { label: "INT", value: int },
    { label: "WIS", value: wis },
    { label: "CHA", value: cha },
  ];

  const modString = (score: number) => {
    const m = Math.floor((score - 10) / 2);
    return m >= 0 ? `+${m}` : `${m}`;
  };

  return (
    <div
      style={{
        background: "rgba(0,0,0,0.4)",
        border: "1px solid rgba(201,168,76,0.2)",
        borderRadius: "12px",
        padding: isMobile ? "16px" : "32px",
        maxWidth: "700px",
      }}
    >
      {/* Character header */}
      <div style={{ marginBottom: "24px" }}>
        <h2
          style={{
            color: GOLD,
            fontSize: "22px",
            fontWeight: "bold",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            fontFamily: SERIF,
            marginBottom: "4px",
          }}
        >
          {name ?? "Unknown"}
        </h2>
        <p style={{ color: GOLD_BRIGHT, fontSize: "14px", fontFamily: SERIF, marginBottom: "2px" }}>
          Level {level} {race ?? ""} {charClass ?? ""}
          {subclass ? ` (${subclass})` : ""}
        </p>
        {alignment && (
          <p style={{ color: GOLD_MUTED, fontSize: "12px", fontFamily: SERIF }}>
            {alignment}
          </p>
        )}
      </div>

      {/* Combat stats */}
      <div
        style={{
          display: "flex",
          gap: "24px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        {[
          { label: "HP", value: `${currentHp}/${maxHp}${tempHp > 0 ? ` (+${tempHp})` : ""}` },
          { label: "AC", value: ac },
          { label: "Speed", value: `${speed} ft.` },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "rgba(201,168,76,0.08)",
              border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: "8px",
              padding: "12px 20px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                color: GOLD_MUTED,
                fontSize: "10px",
                letterSpacing: "1px",
                textTransform: "uppercase",
                marginBottom: "4px",
                fontFamily: SERIF,
              }}
            >
              {stat.label}
            </div>
            <div
              style={{
                color: GOLD_BRIGHT,
                fontSize: "18px",
                fontWeight: "bold",
                fontFamily: SERIF,
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Ability scores */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(6, 1fr)",
          gap: "8px",
          marginBottom: "24px",
        }}
      >
        {abilityScores.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "rgba(201,168,76,0.05)",
              border: "1px solid rgba(201,168,76,0.15)",
              borderRadius: "8px",
              padding: "10px 4px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                color: GOLD_MUTED,
                fontSize: "10px",
                letterSpacing: "1px",
                marginBottom: "4px",
                fontFamily: SERIF,
              }}
            >
              {stat.label}
            </div>
            <div
              style={{
                color: GOLD_BRIGHT,
                fontSize: "18px",
                fontWeight: "bold",
                fontFamily: SERIF,
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                color: GOLD_MUTED,
                fontSize: "11px",
                fontFamily: SERIF,
              }}
            >
              {modString(stat.value)}
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div
        style={{
          height: "1px",
          background: "rgba(201,168,76,0.2)",
          marginBottom: "24px",
        }}
      />

      {/* Link to full character sheet */}
      <Link
        href={`/characters/${characterId}`}
        style={{
          display: "inline-block",
          background: "linear-gradient(135deg, #8b6914, #c9a84c)",
          color: "#1a1a2e",
          borderRadius: "6px",
          padding: "10px 24px",
          fontSize: "13px",
          fontFamily: SERIF,
          fontWeight: "bold",
          textDecoration: "none",
          letterSpacing: "0.5px",
        }}
      >
        Open Full Character Sheet
      </Link>
    </div>
  );
}
