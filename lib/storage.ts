import type { Item, Stage } from "./types";

const STORAGE_KEY = "modeflow:items:v1";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function loadItems(): Item[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidItem);
  } catch {
    return [];
  }
}

export function saveItems(items: Item[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

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

export function moveItem(items: Item[], id: string, stage: Stage): Item[] {
  return updateItem(items, id, { stage });
}

export function archiveItem(items: Item[], id: string): Item[] {
  const now = new Date().toISOString();
  return items.map((item) => {
    if (item.id !== id) return item;
    return { ...item, archivedAt: now, updatedAt: now };
  });
}

export function restoreItem(items: Item[], id: string, stage: Stage): Item[] {
  return items.map((item) => {
    if (item.id !== id) return item;
    const { archivedAt: _, ...rest } = item;
    return { ...rest, stage, updatedAt: new Date().toISOString() };
  });
}

export function deleteItem(items: Item[], id: string): Item[] {
  return items.filter((item) => item.id !== id);
}
