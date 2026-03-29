import { sectionTitleStyle, labelStyle, inputStyle, type FormState } from "./shared";
import { useIsMobile } from "@/hooks/useIsMobile";

interface CombatSectionProps {
  form: FormState;
  isLoading: boolean;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export function CombatSection({
  form,
  isLoading,
  onFormChange,
}: CombatSectionProps) {
  const isMobile = useIsMobile();
  return (
    <div>
      <p style={sectionTitleStyle}>Combat</p>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: "16px" }}>
        <div>
          <label htmlFor="maxHp" style={labelStyle}>Max HP</label>
          <input id="maxHp" name="maxHp" type="number" min={1} value={form.maxHp} onChange={onFormChange} style={inputStyle} required disabled={isLoading} />
        </div>
        <div>
          <label htmlFor="armorClass" style={labelStyle}>Armor Class</label>
          <input id="armorClass" name="armorClass" type="number" min={1} max={30} value={form.armorClass} onChange={onFormChange} style={inputStyle} required disabled={isLoading} />
        </div>
        <div>
          <label htmlFor="speed" style={labelStyle}>Speed (ft)</label>
          <input id="speed" name="speed" type="number" min={0} max={120} value={form.speed} onChange={onFormChange} style={inputStyle} required disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}
