"use client";

import type { AppView, Item, Stage } from "@/lib/types";
import { STAGES, STAGE_META } from "@/lib/types";

type ContextPaneProps = {
  view: AppView;
  item: Item | null;
  restoreStage: Stage;
  onRestoreStageChange: (stage: Stage) => void;
  onUpdate: (id: string, patch: Partial<Item>) => void;
  onRestore: (id: string, stage: Stage) => void;
  onArchive: (id: string) => void;
  onMove: (id: string, stage: Stage) => void;
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
  item,
  restoreStage,
  onRestoreStageChange,
  onUpdate,
  onRestore,
  onArchive,
  onMove,
}: ContextPaneProps) {
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
          className="px-4 py-8 font-mono-ui text-xs"
          style={{ color: "var(--text-dim)" }}
        >
          — select an item
        </p>
      </aside>
    );
  }

  const isArchived = Boolean(item.archivedAt);
  const meta = STAGE_META[item.stage];

  function saveNotes(notes: string) {
    onUpdate(item!.id, { notes: notes.trim() || undefined });
  }

  function saveLinks(text: string) {
    const links = parseLines(text);
    onUpdate(item!.id, {
      exploreLinks: links.length ? links : undefined,
    });
  }

  function saveChecklist(text: string) {
    const lines = parseLines(text);
    const prev = item!.testChecklistChecked ?? [];
    const checked = lines.map((_, i) => prev[i] ?? false);
    onUpdate(item!.id, {
      testChecklist: lines.length ? lines : undefined,
      testChecklistChecked: lines.length ? checked : undefined,
    });
  }

  function toggleCheck(index: number) {
    const list = item!.testChecklist ?? [];
    const checked = [...(item!.testChecklistChecked ?? list.map(() => false))];
    while (checked.length < list.length) checked.push(false);
    checked[index] = !checked[index];
    onUpdate(item!.id, { testChecklistChecked: checked });
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
          <span className={meta.accentClass}>{meta.glyph}</span> {item.title}
        </div>
        {!isArchived && (
          <div className="mt-2 flex flex-wrap gap-1 font-mono-ui text-[10px]">
            {STAGES.filter((s) => s !== item.stage).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onMove(item.id, s)}
                className="px-1.5 py-0.5 hover:bg-[var(--bg-hover)]"
                style={{ color: "var(--text-muted)" }}
              >
                → {STAGE_META[s].label}
              </button>
            ))}
            {item.stage === "test" && (
              <button
                type="button"
                onClick={() => onArchive(item.id)}
                className="px-1.5 py-0.5 hover:bg-[var(--bg-hover)]"
                style={{ color: "var(--accent-test)" }}
              >
                archive
              </button>
            )}
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
          rows={6}
          className="mb-4 w-full resize-y rounded-sm border bg-transparent px-2 py-1.5 text-xs outline-none focus:border-[var(--border-subtle)]"
          style={{
            borderColor: "var(--border-subtle)",
            color: "var(--text-primary)",
            background: "var(--bg-base)",
          }}
          onBlur={(e) => saveNotes(e.target.value)}
        />

        {(item.stage === "explore" || item.exploreLinks?.length) && (
          <>
            <label
              className="mb-1 block text-[10px] uppercase tracking-wider"
              style={{ color: "var(--text-dim)" }}
            >
              links
            </label>
            <textarea
              key={`links-${item.id}-${item.updatedAt}`}
              defaultValue={linesToText(item.exploreLinks)}
              rows={4}
              placeholder="one url per line"
              className="mb-4 w-full resize-y rounded-sm border bg-transparent px-2 py-1.5 text-xs outline-none"
              style={{
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
                background: "var(--bg-base)",
              }}
              onBlur={(e) => saveLinks(e.target.value)}
            />
          </>
        )}

        {(item.stage === "test" || item.testChecklist?.length) && (
          <>
            <label
              className="mb-1 block text-[10px] uppercase tracking-wider"
              style={{ color: "var(--text-dim)" }}
            >
              validation
            </label>
            {(item.testChecklist ?? []).length > 0 ? (
              <ul className="mb-3 space-y-1">
                {(item.testChecklist ?? []).map((line, i) => {
                  const checked = item.testChecklistChecked?.[i] ?? false;
                  return (
                    <li key={i} className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => toggleCheck(i)}
                        className="shrink-0"
                        style={{
                          color: checked
                            ? "var(--accent-test)"
                            : "var(--text-dim)",
                        }}
                      >
                        {checked ? "[x]" : "[ ]"}
                      </button>
                      <span
                        style={{
                          color: checked
                            ? "var(--text-dim)"
                            : "var(--text-primary)",
                          textDecoration: checked ? "line-through" : undefined,
                        }}
                      >
                        {line}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : null}
            <textarea
              key={`check-${item.id}-${item.updatedAt}`}
              defaultValue={linesToText(item.testChecklist)}
              rows={4}
              placeholder="checklist items, one per line"
              className="mb-4 w-full resize-y rounded-sm border bg-transparent px-2 py-1.5 text-xs outline-none"
              style={{
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
                background: "var(--bg-base)",
              }}
              onBlur={(e) => saveChecklist(e.target.value)}
            />
          </>
        )}

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
              onChange={(e) =>
                onRestoreStageChange(e.target.value as Stage)
              }
              className="w-full rounded-sm border px-2 py-1 text-xs"
              style={{
                borderColor: "var(--border-subtle)",
                background: "var(--bg-base)",
                color: "var(--text-primary)",
              }}
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_META[s].label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onRestore(item.id, restoreStage)}
              className="w-full rounded-sm py-1.5 text-xs hover:bg-[var(--bg-hover)]"
              style={{ color: "var(--accent-test)" }}
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
