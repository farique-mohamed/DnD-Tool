import Head from "next/head";
import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { CLASS_LIST, type ClassInfo } from "@/lib/classData";

function ClassListPanel({
  selected,
  onSelect,
}: {
  selected: ClassInfo;
  onSelect: (c: ClassInfo) => void;
}) {
  return (
    <div
      style={{
        width: "200px",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      {CLASS_LIST.map((cls) => {
        const isActive = cls.name === selected.name;
        return (
          <button
            key={cls.name}
            onClick={() => onSelect(cls)}
            style={{
              textAlign: "left",
              padding: "10px 14px",
              background: isActive
                ? "rgba(201,168,76,0.15)"
                : "rgba(0,0,0,0.3)",
              border: isActive
                ? "1px solid rgba(201,168,76,0.5)"
                : "1px solid rgba(201,168,76,0.15)",
              borderLeft: isActive
                ? "3px solid #c9a84c"
                : "3px solid transparent",
              borderRadius: "6px",
              color: isActive ? "#c9a84c" : "#e8d5a3",
              fontSize: "13px",
              fontFamily: "'Georgia', 'Times New Roman', serif",
              cursor: "pointer",
              letterSpacing: "0.3px",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(201,168,76,0.08)";
                (e.currentTarget as HTMLButtonElement).style.color = "#c9a84c";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(0,0,0,0.3)";
                (e.currentTarget as HTMLButtonElement).style.color = "#e8d5a3";
              }
            }}
          >
            {cls.name}
          </button>
        );
      })}
    </div>
  );
}

function ClassDetailPanel({ cls }: { cls: ClassInfo }) {
  return (
    <div
      style={{
        flex: 1,
        background: "rgba(0,0,0,0.6)",
        border: "2px solid #c9a84c",
        borderRadius: "12px",
        boxShadow:
          "0 0 40px rgba(201,168,76,0.3), inset 0 0 60px rgba(0,0,0,0.5)",
        padding: "36px 40px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        minWidth: 0,
      }}
    >
      {/* Header */}
      <div>
        <h2
          style={{
            color: "#c9a84c",
            fontSize: "28px",
            fontWeight: "bold",
            letterSpacing: "2px",
            textTransform: "uppercase",
            fontFamily: "'Georgia', 'Times New Roman', serif",
            margin: 0,
            marginBottom: "12px",
          }}
        >
          {cls.name}
        </h2>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <span
            style={{
              background: "linear-gradient(135deg, rgba(139,105,20,0.4), rgba(201,168,76,0.2))",
              border: "1px solid rgba(201,168,76,0.5)",
              borderRadius: "6px",
              padding: "4px 14px",
              color: "#c9a84c",
              fontSize: "14px",
              fontFamily: "'Georgia', serif",
              fontWeight: "bold",
              letterSpacing: "0.5px",
            }}
          >
            {cls.hitDie}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, #c9a84c, transparent)",
          opacity: 0.4,
        }}
      />

      {/* Mechanical details */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
        }}
      >
        {/* Saving Throws */}
        {cls.savingThrows.length > 0 && (
          <div>
            <p
              style={{
                color: "#c9a84c",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "1.2px",
                fontFamily: "'Georgia', serif",
                margin: 0,
                marginBottom: "8px",
              }}
            >
              Saving Throws
            </p>
            <p
              style={{
                color: "#e8d5a3",
                fontSize: "13px",
                fontFamily: "'Georgia', serif",
                margin: 0,
                lineHeight: "1.5",
              }}
            >
              {cls.savingThrows.join(", ")}
            </p>
          </div>
        )}

        {/* Skill Choices */}
        {cls.skillChoices.count > 0 && (
          <div>
            <p
              style={{
                color: "#c9a84c",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "1.2px",
                fontFamily: "'Georgia', serif",
                margin: 0,
                marginBottom: "8px",
              }}
            >
              Skills
            </p>
            <p
              style={{
                color: "#e8d5a3",
                fontSize: "13px",
                fontFamily: "'Georgia', serif",
                margin: 0,
                lineHeight: "1.5",
              }}
            >
              Choose {cls.skillChoices.count}
            </p>
          </div>
        )}

        {/* Armor */}
        {cls.armorProficiencies.length > 0 && (
          <div>
            <p
              style={{
                color: "#c9a84c",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "1.2px",
                fontFamily: "'Georgia', serif",
                margin: 0,
                marginBottom: "8px",
              }}
            >
              Armor Proficiencies
            </p>
            <p
              style={{
                color: "#e8d5a3",
                fontSize: "13px",
                fontFamily: "'Georgia', serif",
                margin: 0,
                lineHeight: "1.5",
              }}
            >
              {cls.armorProficiencies.join(", ")}
            </p>
          </div>
        )}

        {/* Weapons */}
        {cls.weaponProficiencies.length > 0 && (
          <div>
            <p
              style={{
                color: "#c9a84c",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "1.2px",
                fontFamily: "'Georgia', serif",
                margin: 0,
                marginBottom: "8px",
              }}
            >
              Weapon Proficiencies
            </p>
            <p
              style={{
                color: "#e8d5a3",
                fontSize: "13px",
                fontFamily: "'Georgia', serif",
                margin: 0,
                lineHeight: "1.5",
              }}
            >
              {cls.weaponProficiencies.join(", ")}
            </p>
          </div>
        )}
      </div>

      {/* Skill list */}
      {cls.skillChoices.count > 0 && cls.skillChoices.from.length > 0 && cls.skillChoices.from[0] !== "Any skill" && (
        <div>
          <p
            style={{
              color: "#c9a84c",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "1.2px",
              fontFamily: "'Georgia', serif",
              margin: 0,
              marginBottom: "10px",
            }}
          >
            Choose {cls.skillChoices.count} skill{cls.skillChoices.count > 1 ? "s" : ""} from
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {cls.skillChoices.from.map((skill) => (
              <span
                key={skill}
                style={{
                  background: "rgba(201,168,76,0.08)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  borderRadius: "4px",
                  padding: "3px 10px",
                  color: "#a89060",
                  fontSize: "12px",
                  fontFamily: "'Georgia', serif",
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      <div
        style={{
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, #c9a84c, transparent)",
          opacity: 0.3,
        }}
      />

      {/* Description */}
      {cls.description && (
        <div>
          <p
            style={{
              color: "#c9a84c",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "1.2px",
              fontFamily: "'Georgia', serif",
              margin: 0,
              marginBottom: "12px",
            }}
          >
            About the {cls.name}
          </p>
          <p
            style={{
              color: "#d4b896",
              fontSize: "14px",
              fontFamily: "'Georgia', 'Times New Roman', serif",
              lineHeight: "1.75",
              margin: 0,
              fontStyle: "italic",
            }}
          >
            {cls.description}
          </p>
        </div>
      )}
    </div>
  );
}

function ClassCompendiumContent() {
  const [selected, setSelected] = useState<ClassInfo>(CLASS_LIST[0]!);

  return (
    <>
      <Head>
        <title>Class Compendium — DnD Tool</title>
      </Head>
      <div style={{ maxWidth: "960px" }}>
        <h1
          style={{
            color: "#c9a84c",
            fontSize: "26px",
            fontWeight: "bold",
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginBottom: "8px",
            fontFamily: "'Georgia', 'Times New Roman', serif",
          }}
        >
          Class Compendium
        </h1>
        <p
          style={{
            color: "#a89060",
            fontSize: "14px",
            marginBottom: "32px",
            fontFamily: "'Georgia', serif",
          }}
        >
          Every path begins with a choice of calling.
        </p>
        <div
          style={{
            width: "80px",
            height: "2px",
            background: "#c9a84c",
            marginBottom: "32px",
            opacity: 0.6,
          }}
        />

        <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
          <ClassListPanel selected={selected} onSelect={setSelected} />
          <ClassDetailPanel cls={selected} />
        </div>
      </div>
    </>
  );
}

export default function ClassesPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <ClassCompendiumContent />
      </Layout>
    </ProtectedRoute>
  );
}
