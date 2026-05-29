import type { KeyBinding } from "./shortcuts";

export type StageDefinition = {
  id: string;
  label: string;
  subtitle: string;
  glyph: string;
  color: string;
  order: number;
  shortcuts: {
    view: KeyBinding;
    moveTo: KeyBinding;
  };
};

export const DEFAULT_STAGES: StageDefinition[] = [
  {
    id: "explore",
    label: "Explore",
    subtitle: "Unsure / need research or external input",
    glyph: "?",
    color: "#d4a017",
    order: 0,
    shortcuts: { view: { key: "1" }, moveTo: { key: "e", shift: true } },
  },
  {
    id: "build",
    label: "Build",
    subtitle: "Know how; execution, repetition, or waiting",
    glyph: "~",
    color: "#4a9eff",
    order: 1,
    shortcuts: { view: { key: "2" }, moveTo: { key: "b" } },
  },
  {
    id: "test",
    label: "Test",
    subtitle: "Built; need to validate before I can drop it",
    glyph: "✓",
    color: "#3dd68c",
    order: 2,
    shortcuts: { view: { key: "3" }, moveTo: { key: "t" } },
  },
];

export function sortedStages(stages: StageDefinition[]): StageDefinition[] {
  return [...stages].sort((a, b) => a.order - b.order);
}

export function getStage(
  stages: StageDefinition[],
  id: string
): StageDefinition | undefined {
  return stages.find((s) => s.id === id);
}

export function createStage(partial?: Partial<StageDefinition>): StageDefinition {
  const order = partial?.order ?? 0;
  return {
    id: partial?.id ?? crypto.randomUUID(),
    label: partial?.label ?? "New Stage",
    subtitle: partial?.subtitle ?? "",
    glyph: partial?.glyph ?? "+",
    color: partial?.color ?? "#737373",
    order,
    shortcuts: partial?.shortcuts ?? {
      view: { key: "" },
      moveTo: { key: "" },
    },
  };
}

export function reorderStages(
  stages: StageDefinition[],
  id: string,
  direction: "up" | "down"
): StageDefinition[] {
  const sorted = sortedStages(stages);
  const idx = sorted.findIndex((s) => s.id === id);
  if (idx === -1) return stages;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= sorted.length) return stages;
  const next = sorted.map((s) => ({ ...s }));
  const tmp = next[idx].order;
  next[idx].order = next[swapIdx].order;
  next[swapIdx].order = tmp;
  return next;
}
