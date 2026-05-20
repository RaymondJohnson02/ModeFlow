"use client";

import { useRef } from "react";
import { exportFilename, exportToJson, importFromJson } from "@/lib/export";
import type { Item } from "@/lib/types";

type ExportImportProps = {
  items: Item[];
  onImport: (items: Item[]) => void;
  onStatus: (msg: string) => void;
};

export function ExportImport({ items, onImport, onStatus }: ExportImportProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    const json = exportToJson(items);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportFilename();
    a.click();
    URL.revokeObjectURL(url);
    onStatus(`Exported ${items.length} items`);
  }

  function handleImportClick() {
    fileRef.current?.click();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      if (typeof text !== "string") return;
      const result = importFromJson(text);
      if (!result.ok) {
        onStatus(`Import failed: ${result.error}`);
        return;
      }
      onImport(result.items);
      onStatus(`Imported ${result.items.length} items (replaced all data)`);
    };
    reader.readAsText(file);
  }

  return (
    <div className="flex flex-col gap-0.5 px-2 py-2">
      <button
        type="button"
        onClick={handleExport}
        className="w-full px-2 py-1 text-left font-mono-ui text-[11px] hover:bg-[var(--bg-hover)]"
        style={{ color: "var(--text-muted)" }}
      >
        export
      </button>
      <button
        type="button"
        onClick={handleImportClick}
        className="w-full px-2 py-1 text-left font-mono-ui text-[11px] hover:bg-[var(--bg-hover)]"
        style={{ color: "var(--text-muted)" }}
      >
        import
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
