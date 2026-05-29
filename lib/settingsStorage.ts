import {
  DEFAULT_SHORTCUTS,
  mergeShortcuts,
  SHORTCUT_ACTIONS,
  type KeyBinding,
  type ShortcutAction,
  type ShortcutMap,
} from "./shortcuts";

const SHORTCUTS_KEY = "modeflow:shortcuts:v1";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isValidBinding(value: unknown): value is KeyBinding {
  if (!value || typeof value !== "object") return false;
  const b = value as Record<string, unknown>;
  return typeof b.key === "string" && b.key.length > 0;
}

export function loadShortcuts(): ShortcutMap {
  if (!isBrowser()) return { ...DEFAULT_SHORTCUTS };
  try {
    const raw = localStorage.getItem(SHORTCUTS_KEY);
    if (!raw) return { ...DEFAULT_SHORTCUTS };
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_SHORTCUTS };
    const record = parsed as Record<string, unknown>;
    const partial: Partial<ShortcutMap> = {};
    for (const action of SHORTCUT_ACTIONS) {
      const binding = record[action];
      if (isValidBinding(binding)) {
        partial[action] = binding;
      }
    }
    return mergeShortcuts(partial);
  } catch {
    return { ...DEFAULT_SHORTCUTS };
  }
}

export function saveShortcuts(shortcuts: ShortcutMap): void {
  if (!isBrowser()) return;
  localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(shortcuts));
}

export function updateShortcut(
  shortcuts: ShortcutMap,
  action: ShortcutAction,
  binding: KeyBinding
): ShortcutMap {
  return { ...shortcuts, [action]: binding };
}

export function resetShortcuts(): ShortcutMap {
  const defaults = { ...DEFAULT_SHORTCUTS };
  saveShortcuts(defaults);
  return defaults;
}
