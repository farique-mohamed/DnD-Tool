// ---------------------------------------------------------------------------
// ImportCharacterModal — file-picker + preview + import for JSON characters
// ---------------------------------------------------------------------------

import React, { useState, useRef } from "react";
import { Modal, Button, Input, Alert, GOLD, GOLD_MUTED, GOLD_BRIGHT, SERIF } from "@/components/ui";
import { api } from "@/utils/api";

interface ImportCharacterModalProps {
  open: boolean;
  onClose: () => void;
}

export const ImportCharacterModal = ({ open, onClose }: ImportCharacterModalProps) => {
  const utils = api.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parsedData, setParsedData] = useState<Record<string, unknown> | null>(null);
  const [characterName, setCharacterName] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const importMutation = api.character.import.useMutation({
    onSuccess: (created) => {
      void utils.character.list.invalidate();
      const name = (created as { name?: string })?.name ?? characterName;
      setSuccessMessage(`"${name}" imported successfully!`);
      // Reset after a short delay so the user sees the success message
      setTimeout(() => {
        handleReset();
        onClose();
      }, 1500);
    },
    onError: (err) => {
      setParseError(err.message ?? "Import failed. Please try again.");
    },
  });

  const handleReset = () => {
    setParsedData(null);
    setCharacterName("");
    setParseError(null);
    setFileName(null);
    setSuccessMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParseError(null);
    setSuccessMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      setParseError("Please select a .json file.");
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result;
        if (typeof text !== "string") {
          setParseError("Could not read file.");
          return;
        }
        const json: unknown = JSON.parse(text);
        if (typeof json !== "object" || json === null || Array.isArray(json)) {
          setParseError("Invalid character file: expected a JSON object.");
          return;
        }
        const data = json as Record<string, unknown>;

        // Validate minimum required fields
        if (!data.name || typeof data.name !== "string") {
          setParseError('Invalid character file: missing "name" field.');
          return;
        }
        if (!data.characterClass && !data.class) {
          setParseError('Invalid character file: missing "characterClass" field.');
          return;
        }
        if (!data.race) {
          setParseError('Invalid character file: missing "race" field.');
          return;
        }

        setParsedData(data);
        setCharacterName(data.name as string);
      } catch {
        setParseError("Failed to parse JSON. The file may be corrupted or not valid JSON.");
        setParsedData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!parsedData) return;
    setParseError(null);
    // The parsed JSON is validated by the server's Zod schema.
    // We use a type assertion here because the file data is dynamic.
    importMutation.mutate({
      data: parsedData as Parameters<typeof importMutation.mutate>[0]["data"],
      name: characterName.trim() || undefined,
    });
  };

  return (
    <Modal open={open} onClose={handleClose} title="Import Character">
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* File picker */}
        <div>
          <label
            style={{
              display: "block",
              color: GOLD_MUTED,
              fontSize: "12px",
              fontFamily: SERIF,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "8px",
            }}
          >
            Character File (.json)
          </label>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose File
            </Button>
            <span
              style={{
                color: GOLD_MUTED,
                fontSize: "13px",
                fontFamily: SERIF,
              }}
            >
              {fileName ?? "No file selected"}
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>

        {/* Error */}
        {parseError && (
          <Alert variant="error">{parseError}</Alert>
        )}

        {/* Success */}
        {successMessage && (
          <Alert variant="success">{successMessage}</Alert>
        )}

        {/* Preview */}
        {parsedData && !successMessage && (
          <>
            {/* Character preview card */}
            <div
              style={{
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(201,168,76,0.2)",
                borderRadius: "8px",
                padding: "12px 16px",
              }}
            >
              <div
                style={{
                  color: GOLD_MUTED,
                  fontSize: "10px",
                  fontFamily: SERIF,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "6px",
                }}
              >
                Preview
              </div>
              <div style={{ color: GOLD_BRIGHT, fontSize: "14px", fontFamily: SERIF }}>
                {parsedData.name as string}
              </div>
              <div style={{ color: GOLD_MUTED, fontSize: "12px", fontFamily: SERIF, marginTop: "2px" }}>
                {parsedData.level ? `Level ${parsedData.level as number}` : ""}{" "}
                {(parsedData.race as string) ?? ""}{" "}
                {(parsedData.characterClass as string) ?? (parsedData.class as string) ?? ""}
              </div>
            </div>

            {/* Name override */}
            <div>
              <label
                style={{
                  display: "block",
                  color: GOLD_MUTED,
                  fontSize: "12px",
                  fontFamily: SERIF,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "8px",
                }}
              >
                Character Name (editable)
              </label>
              <Input
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="Enter character name"
              />
            </div>

            {/* Import button */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleImport}
                isLoading={importMutation.isPending}
                disabled={!characterName.trim()}
              >
                Import
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
