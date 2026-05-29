"use client";

import { getStage, sortedStages, type StageDefinition } from "@/lib/stages";
import type { AppView, Item, StageId } from "@/lib/types";

type ContextPaneProps = {
  view: AppView;
  stages: StageDefinition[];
  item: Item | null;
  restoreStage: StageId;
  onRestoreStageChange: (stage: StageId) => void;
  onUpdate: (id: string, patch: Partial<Item>) => void;
  onRestore: (id: string, stage: StageId) => void;
  onArchive: (id: string) => void;
  onMove: (id: string, stage: StageId) => void;
};

function parseLines(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function linesToText(lines?: string[]): string {
  return (lines ?? []).join("\n");
}

export function ContextPane({
  view,
  stages,
  item,
  restoreStage,
  onRestoreStageChange,
  onUpdate,
  onRestore,
  onArchive,
  onMove,
}: ContextPaneProps) {
  const ordered = sortedStages(stages);

  if (!item) {
    return (
      <aside
        className="panel-border-l flex w-[320px] shrink-0 flex-col"
        style={{ background: "var(--bg-panel)" }}
      >
        <header
          className="panel-border-b px-4 py-2 font-mono-ui text-[11px]"
          style={{ color: "var(--text-dim)" }}
        >
          CONTEXT
        </header>
        <p
          className="px-4 py-8 font-mono-ui text-xs leading-relaxed"
          style={{ color: "var(--text-dim)" }}
        >
          {view === "settings"
            ? "— configure shortcuts and stages · Esc to leave"
            : "— select an item"}
        </p>
      </aside>
    );
  }

  const isArchived = Boolean(item.archivedAt);
  const meta = getStage(stages, item.stage);

  function saveNotes(notes: string) {
    onUpdate(item!.id, { notes: notes.trim() || undefined });
  }

  function saveLinks(text: string) {
    const links = parseLines(text);
    onUpdate(item!.id, {
      links: links.length ? links : undefined,
    });
  }

  function saveChecklist(text: string) {
    const lines = parseLines(text);
    const prev = item!.checklistChecked ?? [];
    const checked = lines.map((_, i) => prev[i] ?? false);
    onUpdate(item!.id, {
      checklist: lines.length ? lines : undefined,
      checklistChecked: lines.length ? checked : undefined,
    });
  }

  function toggleCheck(index: number) {
    const list = item!.checklist ?? [];
    const checked = [...(item!.checklistChecked ?? list.map(() => false))];
    while (checked.length < list.length) checked.push(false);
    checked[index] = !checked[index];
    onUpdate(item!.id, { checklistChecked: checked });
  }

  return (
    <aside
      className="panel-border-l flex w-[320px] shrink-0 flex-col"
      style={{ background: "var(--bg-panel)" }}
    >
      <header
        className="panel-border-b px-4 py-2"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="font-mono-ui text-xs" style={{ color: "var(--text-primary)" }}>
          <span style={{ color: meta?.color }}>{meta?.glyph ?? "?"}</span>{" "}
          {item.title}
        </div>
        {!isArchived && (
          <div className="mt-2 flex flex-wrap gap-1 font-mono-ui text-[10px]">
            {ordered
              .filter((s) => s.id !== item.stage)
              .map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onMove(item.id, s.id)}
                  className="px-1.5 py-0.5 hover:bg-[var(--bg-hover)]"
                  style={{ color: "var(--text-muted)" }}
                >
                  → {s.label}
                </button>
              ))}
            <button
              type="button"
              onClick={() => onArchive(item.id)}
              className="px-1.5 py-0.5 hover:bg-[var(--bg-hover)]"
              style={{ color: meta?.color ?? "var(--text-muted)" }}
            >
              archive
            </button>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3 font-mono-ui text-xs">
        <label
          className="mb-1 block text-[10px] uppercase tracking-wider"
          style={{ color: "var(--text-dim)" }}
        >
          notes
        </label>
        <textarea
          key={`notes-${item.id}-${item.updatedAt}`}
          defaultValue={item.notes ?? ""}
          rows={5}
          className="mb-4 w-full resize-y rounded-sm border bg-transparent px-2 py-1.5 text-xs outline-none"
          style={{
            borderColor: "var(--border-subtle)",
            color: "var(--text-primary)",
            background: "var(--bg-base)",
          }}
          onBlur={(e) => saveNotes(e.target.value)}
        />

        <label
          className="mb-1 block text-[10px] uppercase tracking-wider"
          style={{ color: "var(--text-dim)" }}
        >
          links
        </label>
        <textarea
          key={`links-${item.id}-${item.updatedAt}`}
          defaultValue={linesToText(item.links)}
          rows={3}
          placeholder="one url per line"
          className="mb-4 w-full resize-y rounded-sm border bg-transparent px-2 py-1.5 text-xs outline-none"
          style={{
            borderColor: "var(--border-subtle)",
            color: "var(--text-primary)",
            background: "var(--bg-base)",
          }}
          onBlur={(e) => saveLinks(e.target.value)}
        />

        <label
          className="mb-1 block text-[10px] uppercase tracking-wider"
          style={{ color: "var(--text-dim)" }}
        >
          validation
        </label>
        {(item.checklist ?? []).length > 0 && (
          <ul className="mb-3 space-y-1">
            {(item.checklist ?? []).map((line, i) => {
              const checked = item.checklistChecked?.[i] ?? false;
              return (
                <li key={i} className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => toggleCheck(i)}
                    className="shrink-0"
                    style={{
                      color: checked
                        ? meta?.color ?? "var(--text-dim)"
                        : "var(--text-dim)",
                    }}
                  >
                    {checked ? "[x]" : "[ ]"}
                  </button>
                  <span
                    style={{
                      color: checked ? "var(--text-dim)" : "var(--text-primary)",
                      textDecoration: checked ? "line-through" : undefined,
                    }}
                  >
                    {line}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <textarea
          key={`check-${item.id}-${item.updatedAt}`}
          defaultValue={linesToText(item.checklist)}
          rows={3}
          placeholder="checklist items, one per line"
          className="mb-4 w-full resize-y rounded-sm border bg-transparent px-2 py-1.5 text-xs outline-none"
          style={{
            borderColor: "var(--border-subtle)",
            color: "var(--text-primary)",
            background: "var(--bg-base)",
          }}
          onBlur={(e) => saveChecklist(e.target.value)}
        />

        {isArchived && view === "archive" && (
          <div className="mt-4 space-y-2">
            <label
              className="block text-[10px] uppercase tracking-wider"
              style={{ color: "var(--text-dim)" }}
            >
              restore to
            </label>
            <select
              value={restoreStage}
              onChange={(e) => onRestoreStageChange(e.target.value)}
              className="w-full rounded-sm border px-2 py-1 text-xs"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--bg-base)",
                color: "var(--text-primary)",
              }}
            >
              {ordered.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onRestore(item.id, restoreStage)}
              className="w-full rounded-sm py-1.5 text-xs hover:bg-[var(--bg-hover)]"
              style={{ color: meta?.color ?? "var(--text-primary)" }}
            >
              restore (r)
            </button>
          </div>
        )}
      </div>

      <footer
        className="panel-border-t shrink-0 px-4 py-2 font-mono-ui text-[10px]"
        style={{
          color: "var(--text-dim)",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        created {new Date(item.createdAt).toLocaleString()}
        <br />
        updated {new Date(item.updatedAt).toLocaleString()}
        {item.archivedAt && (
          <>
            <br />
            archived {new Date(item.archivedAt).toLocaleString()}
          </>
        )}
      </footer>
    </aside>
  );
}
