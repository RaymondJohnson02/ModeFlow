"use client";

import { useEffect, useRef } from "react";
import type { StageDefinition } from "@/lib/stages";
import type { Item } from "@/lib/types";

type QueueRowProps = {
  item: Item;
  stage: StageDefinition;
  selected: boolean;
  editing: boolean;
  onSelect: () => void;
  onStartEdit: () => void;
  onSaveTitle: (title: string) => void;
  onCancelEdit: () => void;
};

export function QueueRow({
  item,
  stage,
  selected,
  editing,
  onSelect,
  onStartEdit,
  onSaveTitle,
  onCancelEdit,
}: QueueRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const itemStage = stage;

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function handleSubmit(title: string) {
    const trimmed = title.trim();
    if (trimmed) onSaveTitle(trimmed);
    else onCancelEdit();
  }

  const rowStage = itemStage;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onDoubleClick={(e) => {
        e.preventDefault();
        onStartEdit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !editing) onSelect();
      }}
      className="font-mono-ui flex cursor-default items-start gap-2 px-3 py-1 text-xs leading-relaxed"
      style={{
        background: selected ? "var(--bg-selected)" : undefined,
        color: selected ? "var(--text-primary)" : "var(--text-muted)",
        borderLeft: selected ? `2px solid ${rowStage.color}` : "2px solid transparent",
      }}
    >
      <span className="shrink-0" style={{ color: rowStage.color, width: "1ch" }}>
        {rowStage.glyph}
      </span>
      {editing ? (
        <input
          ref={inputRef}
          defaultValue={item.title}
          className="min-w-0 flex-1 bg-transparent text-xs outline-none"
          style={{ color: "var(--text-primary)" }}
          onBlur={(e) => handleSubmit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit(e.currentTarget.value);
            }
            if (e.key === "Escape") {
              e.preventDefault();
              onCancelEdit();
            }
            e.stopPropagation();
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="min-w-0 flex-1 truncate">{item.title}</span>
      )}
    </div>
  );
}
