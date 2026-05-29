import { firstStageId, loadStages } from "./stagesStorage";
import type { Item, StageId } from "./types";

const STORAGE_KEY = "modeflow:items:v1";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

type LegacyItem = Record<string, unknown>;

function migrateItem(raw: LegacyItem): Item | null {
  if (typeof raw.id !== "string" || typeof raw.title !== "string") return null;
  if (typeof raw.createdAt !== "string" || typeof raw.updatedAt !== "string")
    return null;

  const stage =
    typeof raw.stage === "string" ? raw.stage : firstStageId(loadStages());

  const links =
    (raw.links as string[] | undefined) ??
    (raw.exploreLinks as string[] | undefined);
  const checklist =
    (raw.checklist as string[] | undefined) ??
    (raw.testChecklist as string[] | undefined);
  const checklistChecked =
    (raw.checklistChecked as boolean[] | undefined) ??
    (raw.testChecklistChecked as boolean[] | undefined);

  const item: Item = {
    id: raw.id,
    title: raw.title,
    stage,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };

  if (typeof raw.notes === "string") item.notes = raw.notes;
  if (Array.isArray(links) && links.length) item.links = links;
  if (Array.isArray(checklist) && checklist.length) item.checklist = checklist;
  if (Array.isArray(checklistChecked) && checklistChecked.length)
    item.checklistChecked = checklistChecked;
  if (typeof raw.archivedAt === "string") item.archivedAt = raw.archivedAt;

  return item;
}

export function normalizeItems(
  items: Item[],
  validStageIds: string[]
): Item[] {
  const fallback = validStageIds[0] ?? firstStageId(loadStages());
  return items.map((item) => {
    if (validStageIds.includes(item.stage)) return item;
    return { ...item, stage: fallback, updatedAt: new Date().toISOString() };
  });
}

export function loadItems(validStageIds?: string[]): Item[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const ids = validStageIds ?? loadStages().map((s) => s.id);
    const items = parsed
      .map((entry) => migrateItem(entry as LegacyItem))
      .filter((item): item is Item => item !== null);
    return normalizeItems(items, ids);
  } catch {
    return [];
  }
}

export function saveItems(items: Item[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function upsertItem(items: Item[], item: Item): Item[] {
  const index = items.findIndex((i) => i.id === item.id);
  if (index === -1) return [...items, item];
  const next = [...items];
  next[index] = item;
  return next;
}

export function updateItem(
  items: Item[],
  id: string,
  patch: Partial<Omit<Item, "id" | "createdAt">>
): Item[] {
  return items.map((item) => {
    if (item.id !== id) return item;
    return {
      ...item,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
  });
}

export function moveItem(items: Item[], id: string, stage: StageId): Item[] {
  return updateItem(items, id, { stage });
}

export function archiveItem(items: Item[], id: string): Item[] {
  const now = new Date().toISOString();
  return items.map((item) => {
    if (item.id !== id) return item;
    return { ...item, archivedAt: now, updatedAt: now };
  });
}

export function restoreItem(items: Item[], id: string, stage: StageId): Item[] {
  return items.map((item) => {
    if (item.id !== id) return item;
    const { archivedAt: _, ...rest } = item;
    return { ...rest, stage, updatedAt: new Date().toISOString() };
  });
}

export function reassignStage(
  items: Item[],
  fromId: StageId,
  toId: StageId
): Item[] {
  const now = new Date().toISOString();
  return items.map((item) =>
    item.stage === fromId
      ? { ...item, stage: toId, updatedAt: now }
      : item
  );
}

export function deleteItem(items: Item[], id: string): Item[] {
  return items.filter((item) => item.id !== id);
}

export function countItemsInStage(items: Item[], stageId: StageId): number {
  return items.filter((i) => i.stage === stageId && !i.archivedAt).length;
}
