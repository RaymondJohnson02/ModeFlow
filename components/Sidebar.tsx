"use client";

import type { AppView, Item, Stage } from "@/lib/types";
import { STAGES, STAGE_META } from "@/lib/types";
import { ExportImport } from "./ExportImport";

type SidebarProps = {
  view: AppView;
  items: Item[];
  onViewChange: (view: AppView) => void;
  onImport: (items: Item[]) => void;
  onStatus: (msg: string) => void;
};

function countForStage(items: Item[], stage: Stage): number {
  return items.filter((i) => !i.archivedAt && i.stage === stage).length;
}

export function Sidebar({
  view,
  items,
  onViewChange,
  onImport,
  onStatus,
}: SidebarProps) {
  const archivedCount = items.filter((i) => i.archivedAt).length;

  return (
    <aside
      className="panel-border-r flex w-[200px] shrink-0 flex-col"
      style={{ background: "var(--bg-panel)" }}
    >
      <div className="panel-border-b px-3 py-3">
        <div className="font-mono-ui text-xs font-semibold tracking-wide">
          modeflow
        </div>
        <div
          className="mt-0.5 font-mono-ui text-[10px]"
          style={{ color: "var(--text-dim)" }}
        >
          cognitive runtime
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 py-2">
        {STAGES.map((stage) => {
          const meta = STAGE_META[stage];
          const active = view === stage;
          const count = countForStage(items, stage);
          return (
            <button
              key={stage}
              type="button"
              onClick={() => onViewChange(stage)}
              className="mx-1 flex items-center gap-2 px-2 py-1.5 text-left font-mono-ui text-xs hover:bg-[var(--bg-hover)]"
              style={{
                background: active ? "var(--bg-elevated)" : undefined,
                color: active ? "var(--text-primary)" : "var(--text-muted)",
              }}
            >
              <span className={meta.accentClass} style={{ width: "1ch" }}>
                {active ? ">" : " "}
              </span>
              <span className={active ? meta.accentClass : undefined}>
                {meta.glyph}
              </span>
              <span className="flex-1">{meta.label}</span>
              <span style={{ color: "var(--text-dim)" }}>{count}</span>
            </button>
          );
        })}

        <div
          className="mx-3 my-2"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        />

        <button
          type="button"
          onClick={() => onViewChange("archive")}
          className="mx-1 flex items-center gap-2 px-2 py-1.5 text-left font-mono-ui text-xs hover:bg-[var(--bg-hover)]"
          style={{
            background: view === "archive" ? "var(--bg-elevated)" : undefined,
            color:
              view === "archive"
                ? "var(--text-primary)"
                : "var(--text-muted)",
          }}
        >
          <span style={{ width: "1ch" }}>{view === "archive" ? ">" : " "}</span>
          <span style={{ color: "var(--text-dim)" }}>#</span>
          <span className="flex-1">Archive</span>
          <span style={{ color: "var(--text-dim)" }}>{archivedCount}</span>
        </button>
      </nav>

      <div
        className="panel-border-t mt-auto"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <ExportImport items={items} onImport={onImport} onStatus={onStatus} />
      </div>
    </aside>
  );
}
