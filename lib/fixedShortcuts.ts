import type { KeyBinding } from "./shortcuts";

export const OPEN_SETTINGS: KeyBinding = {
  key: ",",
  ctrl: true,
};

export function formatOpenSettingsBinding(): string {
  return "Ctrl+,";
}

export function matchesOpenSettings(e: KeyboardEvent): boolean {
  return (
    e.key === OPEN_SETTINGS.key &&
    !!e.ctrlKey === !!OPEN_SETTINGS.ctrl &&
    !e.shiftKey &&
    !e.altKey &&
    !e.metaKey
  );
}

export function isReservedBinding(binding: KeyBinding): boolean {
  return (
    binding.key === OPEN_SETTINGS.key &&
    !!binding.ctrl === !!OPEN_SETTINGS.ctrl &&
    !binding.shift &&
    !binding.alt &&
    !binding.meta
  );
}
