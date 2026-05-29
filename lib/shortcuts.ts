export type KeyBinding = {
  key: string;
  shift?: boolean;
  ctrl?: boolean;
  alt?: boolean;
  meta?: boolean;
};

export type ShortcutAction =
  | "navigateUp"
  | "navigateDown"
  | "newItem"
  | "editTitle"
  | "deselect"
  | "viewArchive"
  | "archive"
  | "restore"
  | "searchArchive"
  | "toggleHelp"
  | "clearSelection";

export type ShortcutMap = Record<ShortcutAction, KeyBinding>;

export const SHORTCUT_ACTIONS: ShortcutAction[] = [
  "navigateUp",
  "navigateDown",
  "newItem",
  "editTitle",
  "deselect",
  "clearSelection",
  "viewArchive",
  "archive",
  "restore",
  "searchArchive",
  "toggleHelp",
];

export const SHORTCUT_LABELS: Record<ShortcutAction, string> = {
  navigateUp: "Navigate up",
  navigateDown: "Navigate down",
  newItem: "New item",
  editTitle: "Edit title",
  deselect: "Deselect (from new-item input)",
  clearSelection: "Clear selection",
  viewArchive: "View Archive",
  archive: "Archive item",
  restore: "Restore item",
  searchArchive: "Search archive",
  toggleHelp: "Toggle help",
};

export const DEFAULT_SHORTCUTS: ShortcutMap = {
  navigateUp: { key: "k" },
  navigateDown: { key: "j" },
  newItem: { key: "n" },
  editTitle: { key: "e" },
  deselect: { key: "Escape" },
  clearSelection: { key: "Escape" },
  viewArchive: { key: "4" },
  archive: { key: "a" },
  restore: { key: "r" },
  searchArchive: { key: "/" },
  toggleHelp: { key: "?" },
};

export function bindingKey(binding: KeyBinding): string {
  if (!binding.key) return "";
  return [
    binding.ctrl ? "ctrl" : "",
    binding.alt ? "alt" : "",
    binding.meta ? "meta" : "",
    binding.shift ? "shift" : "",
    binding.key,
  ].join("+");
}

export function bindingsEqual(a: KeyBinding, b: KeyBinding): boolean {
  if (!a.key || !b.key) return false;
  return bindingKey(a) === bindingKey(b);
}

export function eventToBinding(e: KeyboardEvent): KeyBinding {
  return {
    key: e.key,
    shift: e.shiftKey || undefined,
    ctrl: e.ctrlKey || undefined,
    alt: e.altKey || undefined,
    meta: e.metaKey || undefined,
  };
}

export function matchesBinding(e: KeyboardEvent, binding: KeyBinding): boolean {
  if (!binding.key) return false;
  return (
    e.key === binding.key &&
    !!e.shiftKey === !!binding.shift &&
    !!e.ctrlKey === !!binding.ctrl &&
    !!e.altKey === !!binding.alt &&
    !!e.metaKey === !!binding.meta
  );
}

export function formatBinding(binding: KeyBinding): string {
  if (!binding.key) return "—";
  const parts: string[] = [];
  if (binding.ctrl) parts.push("Ctrl");
  if (binding.alt) parts.push("Alt");
  if (binding.meta) parts.push("Meta");
  if (binding.shift) parts.push("Shift");
  const keyLabel =
    binding.key === "Escape"
      ? "Esc"
      : binding.key === " "
        ? "Space"
        : binding.key.length === 1
          ? binding.key
          : binding.key;
  parts.push(keyLabel);
  return parts.join("+");
}

export function findActionForEvent(
  shortcuts: ShortcutMap,
  e: KeyboardEvent
): ShortcutAction | null {
  for (const action of SHORTCUT_ACTIONS) {
    if (matchesBinding(e, shortcuts[action])) return action;
  }
  return null;
}

export function findDuplicateAction(
  shortcuts: ShortcutMap,
  action: ShortcutAction,
  binding: KeyBinding
): ShortcutAction | null {
  for (const other of SHORTCUT_ACTIONS) {
    if (other === action) continue;
    if (bindingsEqual(shortcuts[other], binding)) return other;
  }
  return null;
}

export function mergeShortcuts(partial: Partial<ShortcutMap>): ShortcutMap {
  return { ...DEFAULT_SHORTCUTS, ...partial };
}
