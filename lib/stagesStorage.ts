import {
  DEFAULT_STAGES,
  sortedStages,
  type StageDefinition,
} from "./stages";

const STAGES_KEY = "modeflow:stages:v1";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isValidStage(value: unknown): value is StageDefinition {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  const shortcuts = s.shortcuts as Record<string, unknown> | undefined;
  const view = shortcuts?.view as Record<string, unknown> | undefined;
  const moveTo = shortcuts?.moveTo as Record<string, unknown> | undefined;
  return (
    typeof s.id === "string" &&
    typeof s.label === "string" &&
    typeof s.subtitle === "string" &&
    typeof s.glyph === "string" &&
    typeof s.color === "string" &&
    typeof s.order === "number" &&
    !!view &&
    typeof view.key === "string" &&
    !!moveTo &&
    typeof moveTo.key === "string"
  );
}

export function loadStages(): StageDefinition[] {
  if (!isBrowser()) return [...DEFAULT_STAGES];
  try {
    const raw = localStorage.getItem(STAGES_KEY);
    if (!raw) return [...DEFAULT_STAGES];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return [...DEFAULT_STAGES];
    const stages = parsed.filter(isValidStage);
    if (stages.length === 0) return [...DEFAULT_STAGES];
    return sortedStages(stages);
  } catch {
    return [...DEFAULT_STAGES];
  }
}

export function saveStages(stages: StageDefinition[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(STAGES_KEY, JSON.stringify(sortedStages(stages)));
}

export function resetStages(): StageDefinition[] {
  const defaults = DEFAULT_STAGES.map((s) => ({ ...s, shortcuts: { ...s.shortcuts } }));
  saveStages(defaults);
  return defaults;
}

export function stageIds(stages: StageDefinition[]): string[] {
  return sortedStages(stages).map((s) => s.id);
}

export function firstStageId(stages: StageDefinition[]): string {
  return sortedStages(stages)[0]?.id ?? "explore";
}

export function lastStageId(stages: StageDefinition[]): string {
  const sorted = sortedStages(stages);
  return sorted[sorted.length - 1]?.id ?? "explore";
}
