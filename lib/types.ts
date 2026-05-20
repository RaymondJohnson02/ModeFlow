export type Stage = "explore" | "build" | "test";

export type AppView = Stage | "archive";

export type Item = {
  id: string;
  title: string;
  stage: Stage;
  notes?: string;
  exploreLinks?: string[];
  testChecklist?: string[];
  testChecklistChecked?: boolean[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
};

export const STAGES: Stage[] = ["explore", "build", "test"];

export type StageMeta = {
  id: Stage;
  label: string;
  subtitle: string;
  glyph: string;
  accent: string;
  accentClass: string;
  accentBarClass: string;
  hotkey: string;
};

export const STAGE_META: Record<Stage, StageMeta> = {
  explore: {
    id: "explore",
    label: "Explore",
    subtitle: "Unsure / need research or external input",
    glyph: "?",
    accent: "var(--accent-explore)",
    accentClass: "text-accent-explore",
    accentBarClass: "accent-bar-explore",
    hotkey: "e",
  },
  build: {
    id: "build",
    label: "Build",
    subtitle: "Know how; execution, repetition, or waiting",
    glyph: "~",
    accent: "var(--accent-build)",
    accentClass: "text-accent-build",
    accentBarClass: "accent-bar-build",
    hotkey: "b",
  },
  test: {
    id: "test",
    label: "Test",
    subtitle: "Built; need to validate before I can drop it",
    glyph: "✓",
    accent: "var(--accent-test)",
    accentClass: "text-accent-test",
    accentBarClass: "accent-bar-test",
    hotkey: "t",
  },
};

export const MOVE_HINT: Partial<Record<`${Stage}->${Stage}`, string>> = {
  "explore->build": "Ready to execute — moved to Build",
  "build->test": "Built, not verified — moved to Test",
  "test->explore": "Need more research — moved to Explore",
  "test->build": "Validation failed — moved to Build",
  "build->explore": "Blocked or unsure — moved to Explore",
};

export function getMoveHint(from: Stage, to: Stage): string | undefined {
  if (from === to) return undefined;
  return MOVE_HINT[`${from}->${to}`];
}

export function createItem(title: string, stage: Stage): Item {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    stage,
    createdAt: now,
    updatedAt: now,
  };
}

export function isActive(item: Item): boolean {
  return item.archivedAt === undefined;
}

export function stageFromView(view: AppView): Stage | null {
  if (view === "archive") return null;
  return view;
}
