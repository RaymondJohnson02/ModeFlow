"use client";

import { useEffect, useRef } from "react";
import { getStage, type StageDefinition } from "@/lib/stages";
import type { Item } from "@/lib/types";

type ArchiveQueueProps = {
  items: Item[];
  stages: StageDefinition[];
  query: string;
  selectedId: string | null;
  searchRef: React.RefObject<HTMLInputElement | null>;
  onQueryChange: (q: string) => void;
  onSelect: (id: string) => void;
};

export function ArchiveQueue({
  items,
  stages,
  query,
  selectedId,
  searchRef,
  onQueryChange,
  onSelect,
}: ArchiveQueueProps) {
  const filtered = items.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      (item.notes?.toLowerCase().includes(q) ?? false)
    );
  });

  const sorted = [...filtered].sort(
    (a, b) =>
      new Date(b.archivedAt ?? 0).getTime() -
      new Date(a.archivedAt ?? 0).getTime()
  );

  useEffect(() => {
    if (document.activeElement === searchRef.current) return;
  }, [searchRef]);

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <header
        className="panel-border-b shrink-0 px-4 py-2 font-mono-ui text-[11px] tracking-wider"
        style={{
          background: "var(--bg-elevated)",
          color: "var(--text-muted)",
        }}
      >
        <span style={{ color: "var(--text-dim)" }}>#</span> ARCHIVE
        <span style={{ color: "var(--text-dim)" }}> · </span>
        <span>({sorted.length})</span>
      </header>

      <div
        className="panel-border-b shrink-0 px-3 py-2"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2 font-mono-ui text-xs">
          <span style={{ color: "var(--text-dim)" }}>/</span>
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="search title or notes…"
            className="min-w-0 flex-1 bg-transparent outline-none"
            style={{ color: "var(--text-primary)" }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {sorted.length === 0 && (
          <p
            className="px-4 py-8 font-mono-ui text-xs"
            style={{ color: "var(--text-dim)" }}
          >
            — {query ? "no matches" : "nothing archived"}
          </p>
        )}
        {sorted.map((item) => {
          const selected = selectedId === item.id;
          const meta = getStage(stages, item.stage);
          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(item.id)}
              className="font-mono-ui flex cursor-default items-start gap-2 px-3 py-1 text-xs"
              style={{
                background: selected ? "var(--bg-selected)" : undefined,
                color: selected ? "var(--text-primary)" : "var(--text-muted)",
              }}
            >
              <span style={{ color: "var(--text-dim)" }}>#</span>
              <span className="min-w-0 flex-1 truncate">{item.title}</span>
              <span
                className="shrink-0 text-[10px]"
                style={{ color: "var(--text-dim)" }}
              >
                {meta?.glyph ?? "?"}{" "}
                {item.archivedAt
                  ? new Date(item.archivedAt).toLocaleDateString()
                  : ""}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
