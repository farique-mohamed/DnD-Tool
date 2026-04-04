import { api } from "@/utils/api";
import { GOLD, GOLD_MUTED, GOLD_BRIGHT, SERIF, parseJsonArray } from "./shared";
import { getRaceByName } from "@/lib/raceData";
import { ALL_LANGUAGES } from "@/lib/languageData";

interface PlayerLanguageManagerProps {
  adventureId: string;
  adventurePlayerId: string;
  character: Record<string, unknown>;
}

export function PlayerLanguageManager({
  adventureId,
  adventurePlayerId,
  character,
}: PlayerLanguageManagerProps) {
  const utils = api.useUtils();

  const updateLanguages = api.adventure.updatePlayerLanguages.useMutation({
    onSuccess: () => {
      void utils.adventure.getAcceptedPlayers.invalidate({ adventureId });
    },
  });

  const currentLanguages = parseJsonArray(character.languages as string | undefined);
  const raceName = character.race as string | undefined;
  const raceInfo = raceName ? getRaceByName(raceName) : undefined;
  const racialLanguages = new Set(raceInfo?.languages ?? []);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        borderTop: "1px solid rgba(201,168,76,0.15)",
        padding: "12px 16px",
        background: "rgba(0,0,0,0.2)",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontFamily: SERIF,
          color: GOLD,
          fontWeight: "bold",
          marginBottom: "8px",
        }}
      >
        Languages
      </div>
      {currentLanguages.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
          {currentLanguages.map((lang) => {
            const isRacial = racialLanguages.has(lang);
            return (
              <span
                key={lang}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  background: isRacial
                    ? "rgba(201,168,76,0.1)"
                    : "rgba(230,126,34,0.15)",
                  border: isRacial
                    ? "1px solid rgba(201,168,76,0.25)"
                    : "1px solid rgba(230,126,34,0.35)",
                  borderRadius: "4px",
                  padding: "2px 8px",
                  fontSize: "12px",
                  fontFamily: SERIF,
                  color: GOLD_BRIGHT,
                }}
              >
                {lang}
                {isRacial && (
                  <span style={{ color: GOLD_MUTED, fontSize: "10px" }}>(racial)</span>
                )}
                {!isRacial && (
                  <button
                    onClick={() => {
                      const updated = currentLanguages.filter((l) => l !== lang);
                      updateLanguages.mutate({
                        adventureId,
                        adventurePlayerId,
                        languages: updated,
                      });
                    }}
                    disabled={updateLanguages.isPending}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#e74c3c",
                      cursor: updateLanguages.isPending ? "default" : "pointer",
                      fontSize: "14px",
                      lineHeight: 1,
                      padding: "0 2px",
                      opacity: updateLanguages.isPending ? 0.5 : 1,
                    }}
                    title={`Remove ${lang}`}
                  >
                    x
                  </button>
                )}
              </span>
            );
          })}
        </div>
      ) : (
        <p
          style={{
            color: GOLD_MUTED,
            fontSize: "12px",
            fontFamily: SERIF,
            marginBottom: "10px",
          }}
        >
          No languages known.
        </p>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <select
          id={`lang-select-${adventurePlayerId}`}
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(201,168,76,0.3)",
            color: GOLD_BRIGHT,
            borderRadius: "4px",
            padding: "4px 8px",
            fontFamily: SERIF,
            fontSize: "12px",
            flex: 1,
            maxWidth: "200px",
          }}
          defaultValue=""
        >
          <option value="" disabled>
            Add a language...
          </option>
          {ALL_LANGUAGES.filter((l) => !currentLanguages.includes(l)).map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            const select = document.getElementById(
              `lang-select-${adventurePlayerId}`,
            ) as HTMLSelectElement | null;
            if (!select || !select.value) return;
            const newLang = select.value;
            const updated = [...currentLanguages, newLang];
            updateLanguages.mutate({
              adventureId,
              adventurePlayerId,
              languages: updated,
            });
            select.value = "";
          }}
          disabled={updateLanguages.isPending}
          style={{
            background: "rgba(201,168,76,0.15)",
            border: "1px solid rgba(201,168,76,0.3)",
            color: GOLD,
            borderRadius: "4px",
            padding: "4px 12px",
            fontFamily: SERIF,
            fontSize: "12px",
            fontWeight: "bold",
            cursor: updateLanguages.isPending ? "default" : "pointer",
            opacity: updateLanguages.isPending ? 0.6 : 1,
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}
