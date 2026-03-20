import { Key, useState } from "react";
import Head from "next/head";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { api } from "@/utils/api";

type FilterMode = "all" | "magical" | "nonMagical";

const RARITY_COLORS: Record<string, string> = {
  Common: "#a0a0a0",
  Uncommon: "#4caf73",
  Rare: "#5c9edd",
  "Very Rare": "#9b59c4",
  Legendary: "#c9a84c",
};

function rarityColor(rarity: string | null | undefined): string {
  if (!rarity) return "#a0a0a0";
  return RARITY_COLORS[rarity] ?? "#a0a0a0";
}

function ItemCard({
  name,
  description,
  isMagical,
  rarity,
}: {
  name: string;
  description: string | null;
  isMagical: boolean;
  rarity: string | null;
}) {
  return (
    <div
      style={{
        background: "rgba(0,0,0,0.4)",
        border: "1px solid rgba(201,168,76,0.2)",
        borderRadius: "12px",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>{isMagical ? "✨" : "⚔️"}</span>
          <span
            style={{
              color: "#e8d5a3",
              fontSize: "15px",
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontWeight: "bold",
              letterSpacing: "0.3px",
            }}
          >
            {name}
          </span>
        </div>

        {rarity && (
          <span
            style={{
              color: rarityColor(rarity),
              fontSize: "11px",
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontWeight: "bold",
              letterSpacing: "0.8px",
              textTransform: "uppercase",
              border: `1px solid ${rarityColor(rarity)}`,
              borderRadius: "4px",
              padding: "2px 8px",
              whiteSpace: "nowrap",
            }}
          >
            {rarity}
          </span>
        )}
      </div>

      {/* Magical tag */}
      <div>
        <span
          style={{
            fontSize: "11px",
            fontFamily: "'Georgia', 'Times New Roman', serif",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            color: isMagical ? "#c9a84c" : "#a0a0a0",
          }}
        >
          {isMagical ? "Magical Item" : "Mundane Item"}
        </span>
      </div>

      {/* Description */}
      {description && (
        <p
          style={{
            color: "#a89060",
            fontSize: "13px",
            fontFamily: "'Georgia', 'Times New Roman', serif",
            lineHeight: "1.6",
            margin: 0,
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}

function ItemsContent() {
  const [filter, setFilter] = useState<FilterMode>("all");

  const isMagicalParam =
    filter === "magical" ? true : filter === "nonMagical" ? false : undefined;

  const { data: items, isLoading, error } = api.items.list.useQuery(
    { isMagical: isMagicalParam },
    { placeholderData: (previousData: any) => previousData }
  );

  const filters: { key: FilterMode; label: string }[] = [
    { key: "all", label: "All Items" },
    { key: "magical", label: "✨ Magical" },
    { key: "nonMagical", label: "⚔️ Non-Magical" },
  ];

  return (
    <>
      <Head>
        <title>Item Vault — DnD Tool</title>
      </Head>
      <div style={{ maxWidth: "900px" }}>
        {/* Page header */}
        <h1
          style={{
            color: "#c9a84c",
            fontSize: "26px",
            fontWeight: "bold",
            letterSpacing: "2px",
            textTransform: "uppercase",
            fontFamily: "'Georgia', 'Times New Roman', serif",
            marginBottom: "8px",
          }}
        >
          🗡️ Item Vault
        </h1>
        <p
          style={{
            color: "#a89060",
            fontSize: "14px",
            fontFamily: "'Georgia', 'Times New Roman', serif",
            marginBottom: "24px",
          }}
        >
          Peruse the relics and equipment of the realm, adventurer.
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

        {/* Filter tabs */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "32px",
            flexWrap: "wrap",
          }}
        >
          {filters.map(({ key, label }) => {
            const isActive = filter === key;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                style={{
                  background: isActive
                    ? "linear-gradient(135deg, #8b6914, #c9a84c)"
                    : "transparent",
                  color: isActive ? "#1a1a2e" : "#c9a84c",
                  border: isActive
                    ? "none"
                    : "1px solid rgba(201,168,76,0.5)",
                  borderRadius: "4px",
                  padding: "8px 20px",
                  fontFamily: "'Georgia', serif",
                  fontWeight: isActive ? "bold" : "normal",
                  fontSize: "13px",
                  cursor: "pointer",
                  letterSpacing: "0.3px",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Content area */}
        {isLoading && (
          <div
            style={{
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: "12px",
              padding: "60px 40px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "36px", marginBottom: "16px" }}>🔮</div>
            <p
              style={{
                color: "#e8d5a3",
                fontSize: "15px",
                fontFamily: "'Georgia', 'Times New Roman', serif",
              }}
            >
              Searching the vaults...
            </p>
          </div>
        )}

        {error && (
          <div
            style={{
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: "12px",
              padding: "60px 40px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "36px", marginBottom: "16px" }}>💀</div>
            <p
              style={{
                color: "#e8d5a3",
                fontSize: "15px",
                fontFamily: "'Georgia', 'Times New Roman', serif",
              }}
            >
              The vault doors are sealed. Try again shortly.
            </p>
          </div>
        )}

        {!isLoading && !error && items && items.length === 0 && (
          <div
            style={{
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: "12px",
              padding: "60px 40px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>🗄️</div>
            <p
              style={{
                color: "#e8d5a3",
                fontSize: "15px",
                fontFamily: "'Georgia', 'Times New Roman', serif",
                marginBottom: "8px",
              }}
            >
              No items found in these dungeons.
            </p>
            <p
              style={{
                color: "#a89060",
                fontSize: "13px",
                fontFamily: "'Georgia', 'Times New Roman', serif",
              }}
            >
              The vaults are empty for this filter, adventurer.
            </p>
          </div>
        )}

        {!isLoading && !error && items && items.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "16px",
            }}
          >
            {items.map((item: { id: Key | null | undefined; name: string; description: any; isMagical: boolean; rarity: any; }) => (
              <ItemCard
                key={item.id}
                name={item.name}
                description={item.description ?? null}
                isMagical={item.isMagical}
                rarity={item.rarity ?? null}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function ItemsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <ItemsContent />
      </Layout>
    </ProtectedRoute>
  );
}
