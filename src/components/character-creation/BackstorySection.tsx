import { sectionTitleStyle, labelStyle, inputStyle } from "./shared";

interface BackstorySectionProps {
  backstory: string;
  isLoading: boolean;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export function BackstorySection({
  backstory,
  isLoading,
  onFormChange,
}: BackstorySectionProps) {
  return (
    <div>
      <p style={sectionTitleStyle}>Lore</p>
      <div>
        <label htmlFor="backstory" style={labelStyle}>Backstory</label>
        <textarea id="backstory" name="backstory" placeholder="Every hero has a tale... (optional)" value={backstory} onChange={onFormChange} rows={5} style={{ ...inputStyle, resize: "vertical", minHeight: "100px" }} disabled={isLoading} />
      </div>
    </div>
  );
}
