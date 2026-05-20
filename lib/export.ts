import type { Item } from "./types";

export const EXPORT_VERSION = 1;

export type ExportPayload = {
  version: number;
  items: Item[];
};

export function exportToJson(items: Item[]): string {
  const payload: ExportPayload = {
    version: EXPORT_VERSION,
    items,
  };
  return JSON.stringify(payload, null, 2);
}

export function exportFilename(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `modeflow-backup-${date}.json`;
}

export type ImportResult =
  | { ok: true; items: Item[] }
  | { ok: false; error: string };

function isValidItem(value: unknown): value is Item {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    (item.stage === "explore" ||
      item.stage === "build" ||
      item.stage === "test") &&
    typeof item.createdAt === "string" &&
    typeof item.updatedAt === "string"
  );
}

export function importFromJson(raw: string): ImportResult {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return { ok: false, error: "Invalid JSON structure." };
    }
    const record = parsed as Record<string, unknown>;
    if (record.version !== EXPORT_VERSION) {
      return {
        ok: false,
        error: `Unsupported backup version (expected ${EXPORT_VERSION}).`,
      };
    }
    if (!Array.isArray(record.items)) {
      return { ok: false, error: "Missing items array." };
    }
    const items = record.items.filter(isValidItem);
    if (items.length !== record.items.length) {
      return { ok: false, error: "Some items failed validation." };
    }
    return { ok: true, items };
  } catch {
    return { ok: false, error: "Could not parse JSON file." };
  }
}
