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

function migrateImportItem(value: unknown): Item | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.id !== "string" || typeof raw.title !== "string") return null;
  if (typeof raw.stage !== "string") return null;
  if (typeof raw.createdAt !== "string" || typeof raw.updatedAt !== "string")
    return null;

  const item: Item = {
    id: raw.id,
    title: raw.title,
    stage: raw.stage,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };

  if (typeof raw.notes === "string") item.notes = raw.notes;
  const links =
    (raw.links as string[] | undefined) ??
    (raw.exploreLinks as string[] | undefined);
  const checklist =
    (raw.checklist as string[] | undefined) ??
    (raw.testChecklist as string[] | undefined);
  const checklistChecked =
    (raw.checklistChecked as boolean[] | undefined) ??
    (raw.testChecklistChecked as boolean[] | undefined);
  if (Array.isArray(links) && links.length) item.links = links;
  if (Array.isArray(checklist) && checklist.length) item.checklist = checklist;
  if (Array.isArray(checklistChecked) && checklistChecked.length)
    item.checklistChecked = checklistChecked;
  if (typeof raw.archivedAt === "string") item.archivedAt = raw.archivedAt;

  return item;
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
    const items = record.items
      .map(migrateImportItem)
      .filter((item): item is Item => item !== null);
    if (items.length !== record.items.length) {
      return { ok: false, error: "Some items failed validation." };
    }
    return { ok: true, items };
  } catch {
    return { ok: false, error: "Could not parse JSON file." };
  }
}
