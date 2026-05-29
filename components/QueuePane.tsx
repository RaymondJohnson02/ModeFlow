"use client";

import { useEffect, useRef } from "react";
import { getStage, type StageDefinition } from "@/lib/stages";
import type { Item, StageId } from "@/lib/types";
import { QueueRow } from "./QueueRow";

type QueuePaneProps = {
  stage: StageDefinition;
  stages: StageDefinition[];
  items: Item[];
  selectedId: string | null;
  editingId: string | null;
  newItemFocus: boolean;
  onSelect: (id: string) => void;
  onClearNewFocus: () => void;
  onDeselect: () => void;
  onCreate: (title: string) => void;
  onSaveTitle: (id: string, title: string) => void;
  onStartEdit: (id: string) => void;
  onCancelEdit: () => void;
  newInputRef: React.RefObject<HTMLInputElement | null>;
};

export function QueuePane({
  stage,
  stages,
  items,
  selectedId,
  editingId,
  newItemFocus,
  onSelect,
  onClearNewFocus,
  onCreate,
  onSaveTitle,
  onStartEdit,
  onCancelEdit,
  newInputRef,
}: QueuePaneProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (newItemFocus) newInputRef.current?.focus();
  }, [newItemFocus, newInputRef]);

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <header
        className="panel-border-b shrink-0 px-4 py-2 font-mono-ui text-[11px] tracking-wider"
        style={{
          background: "var(--bg-elevated)",
          color: "var(--text-muted)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <span style={{ color: stage.color }}>{stage.label.toUpperCase()}</span>
        <span style={{ color: "var(--text-dim)" }}> · queue </span>
        <span>({items.length})</span>
        <p
          className="mt-1 font-sans text-[10px] font-normal normal-case tracking-normal"
          style={{ color: "var(--text-dim)" }}
        >
          {stage.subtitle}
        </p>
      </header>

      <div ref={listRef} className="flex-1 overflow-y-auto py-1">
        {items.length === 0 && (
          <p
            className="px-4 py-8 font-mono-ui text-xs"
            style={{ color: "var(--text-dim)" }}
          >
            — empty queue
          </p>
        )}
        {items.map((item) => {
          const itemStage = getStage(stages, item.stage) ?? stage;
          return (
          <QueueRow
            key={item.id}
            item={item}
            stage={itemStage}
            selected={selectedId === item.id}
            editing={editingId === item.id}
            onSelect={() => onSelect(item.id)}
            onStartEdit={() => onStartEdit(item.id)}
            onSaveTitle={(title) => onSaveTitle(item.id, title)}
            onCancelEdit={onCancelEdit}
          />
          );
        })}
      </div>

      <div
        className="panel-border-t shrink-0 px-3 py-2"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2 font-mono-ui text-xs">
          <span style={{ color: "var(--text-dim)" }}>_</span>
          <input
            ref={newInputRef}
            type="text"
            data-modeflow="new-item-input"
            placeholder="new item…"
            className="min-w-0 flex-1 bg-transparent outline-none"
            style={{ color: "var(--text-primary)" }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const v = e.currentTarget.value.trim();
                if (v) {
                  onCreate(v);
                  e.currentTarget.value = "";
                }
              }
            }}
            onBlur={onClearNewFocus}
          />
        </div>
      </div>
    </section>
  );
}
