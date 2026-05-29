export type StageId = string;

export type AppView = StageId | "archive" | "settings";

export type Item = {
  id: string;
  title: string;
  stage: StageId;
  notes?: string;
  links?: string[];
  checklist?: string[];
  checklistChecked?: boolean[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
};

export function createItem(title: string, stage: StageId): Item {
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

export function stageFromView(view: AppView): StageId | null {
  if (view === "archive" || view === "settings") return null;
  return view;
}

export function isStageView(view: AppView): view is StageId {
  return view !== "archive" && view !== "settings";
}
