import type { Spell } from "@/lib/spellsData";
import type { MonsterInfo } from "@/lib/bestiaryData";
import type { Item } from "@/lib/itemsData";
import type { ClassInfo } from "@/lib/classData";
import type { RaceInfo } from "@/lib/raceData";
import type { Feat } from "@/lib/featData";
import { SpellDetailPanel } from "@/components/spells/SpellDetailPanel";
import { MonsterDetailPanel } from "@/components/monster-manual/MonsterDetailPanel";
import { ItemDetailPanel } from "@/components/items/ItemDetailPanel";
import { ClassInfoCard } from "@/components/classes/ClassInfoCard";
import { RaceDetailPanel } from "@/components/races/RaceDetailPanel";
import { FeatDetailPanel } from "@/components/feats/FeatDetailPanel";

// ---------------------------------------------------------------------------
// Theme constants
// ---------------------------------------------------------------------------

const GOLD_MUTED = "#a89060";
const GOLD_BORDER = "rgba(201,168,76,0.25)";
const SERIF = "'EB Garamond', 'Georgia', serif";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Category = "Spells" | "Monsters" | "Items" | "Classes" | "Races" | "Feats";

export interface SelectedSearchResult {
  name: string;
  category: Category;
  data: Spell | MonsterInfo | Item | ClassInfo | RaceInfo | Feat;
}

// ---------------------------------------------------------------------------
// Search detail panel — renders the appropriate detail component
// ---------------------------------------------------------------------------

export function SearchDetailPanel({
  result,
  isMobile,
  onBack,
}: {
  result: SelectedSearchResult | null;
  isMobile?: boolean;
  onBack?: () => void;
}) {
  if (!result) {
    return <SearchDetailEmpty isMobile={isMobile} />;
  }

  switch (result.category) {
    case "Spells":
      return (
        <SpellDetailPanel
          spell={result.data as Spell}
          isMobile={isMobile}
          onBack={onBack}
        />
      );
    case "Monsters":
      return (
        <MonsterDetailPanel
          monster={result.data as MonsterInfo}
          isMobile={isMobile}
          onBack={onBack}
        />
      );
    case "Items":
      return (
        <ItemDetailPanel
          item={result.data as Item}
          isMobile={isMobile}
          onBack={onBack}
        />
      );
    case "Classes":
      return (
        <ClassInfoCard
          cls={result.data as ClassInfo}
          isMobile={isMobile}
          onBack={onBack}
        />
      );
    case "Races":
      return (
        <RaceDetailPanel
          race={result.data as RaceInfo}
          isMobile={isMobile}
          onBack={onBack}
        />
      );
    case "Feats":
      return (
        <FeatDetailPanel
          feat={result.data as Feat}
          isMobile={isMobile}
          onBack={onBack}
        />
      );
    default:
      return <SearchDetailEmpty isMobile={isMobile} />;
  }
}

// ---------------------------------------------------------------------------
// Empty detail placeholder
// ---------------------------------------------------------------------------

function SearchDetailEmpty({ isMobile }: { isMobile?: boolean }) {
  return (
    <div
      style={{
        flex: 2,
        background: "rgba(0,0,0,0.4)",
        border: `1px solid ${GOLD_BORDER}`,
        borderRadius: "12px",
        display: isMobile ? "none" : "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 0,
        minHeight: 0,
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
        Select a result to view details.
      </p>
    </div>
  );
}
