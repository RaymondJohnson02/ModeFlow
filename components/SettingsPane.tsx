"use client";

import { useCallback, useEffect, useState } from "react";
import { bindingConflictsWithStages } from "@/hooks/useKeyboard";
import { formatOpenSettingsBinding, isReservedBinding } from "@/lib/fixedShortcuts";
import {
  bindingsEqual,
  eventToBinding,
  findDuplicateAction,
  formatBinding,
  SHORTCUT_ACTIONS,
  SHORTCUT_LABELS,
  type KeyBinding,
  type ShortcutAction,
  type ShortcutMap,
} from "@/lib/shortcuts";
import { resetShortcuts, saveShortcuts, updateShortcut } from "@/lib/settingsStorage";
import {
  createStage,
  reorderStages,
  sortedStages,
  type StageDefinition,
} from "@/lib/stages";
import { resetStages, saveStages } from "@/lib/stagesStorage";
import { countItemsInStage } from "@/lib/storage";
import type { Item } from "@/lib/types";

type SettingsTab = "shortcuts" | "stages";

type CaptureTarget =
  | { type: "shortcut"; action: ShortcutAction }
  | { type: "stage"; stageId: string; field: "view" | "moveTo" };

type SettingsPaneProps = {
  shortcuts: ShortcutMap;
  stages: StageDefinition[];
  items: Item[];
  onShortcutsChange: (shortcuts: ShortcutMap) => void;
  onStagesChange: (stages: StageDefinition[]) => void;
  onDeleteStage: (stageId: string, fallbackId: string) => void;
  onStatus: (msg: string) => void;
  onCapturingChange: (capturing: boolean) => void;
};

export function SettingsPane({
  shortcuts,
  stages,
  items,
  onShortcutsChange,
  onStagesChange,
  onDeleteStage,
  onStatus,
  onCapturingChange,
}: SettingsPaneProps) {
  const [tab, setTab] = useState<SettingsTab>("shortcuts");
  const [capturing, setCapturing] = useState<CaptureTarget | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [fallbackId, setFallbackId] = useState<string>("");

  const sorted = sortedStages(stages);

  useEffect(() => {
    onCapturingChange(capturing !== null);
  }, [capturing, onCapturingChange]);

  const validateBinding = useCallback(
    (binding: KeyBinding, target: CaptureTarget): string | null => {
      if (!binding.key) return "Invalid key.";
      if (isReservedBinding(binding)) return "Ctrl+, is reserved for Settings.";

      if (target.type === "shortcut") {
        const dup = findDuplicateAction(shortcuts, target.action, binding);
        if (dup) return `Already used by "${SHORTCUT_LABELS[dup]}".`;
      }

      const stageConflict = bindingConflictsWithStages(
        stages,
        binding,
        target.type === "stage" ? target.stageId : undefined,
        target.type === "stage" ? target.field : undefined
      );
      if (stageConflict) return `Already used by ${stageConflict}.`;

      for (const action of SHORTCUT_ACTIONS) {
        if (target.type === "shortcut" && target.action === action) continue;
        if (bindingsEqual(shortcuts[action], binding)) {
          return `Already used by "${SHORTCUT_LABELS[action]}".`;
        }
      }

      return null;
    },
    [shortcuts, stages]
  );

  const handleCapture = useCallback(
    (e: KeyboardEvent) => {
      if (!capturing) return;
      e.preventDefault();
      e.stopPropagation();

      if (e.key === "Escape") {
        setCapturing(null);
        setError(null);
        return;
      }

      const binding = eventToBinding(e);
      const err = validateBinding(binding, capturing);
      if (err) {
        setError(err);
        return;
      }

      if (capturing.type === "shortcut") {
        const next = updateShortcut(shortcuts, capturing.action, binding);
        saveShortcuts(next);
        onShortcutsChange(next);
        onStatus(
          `Updated: ${SHORTCUT_LABELS[capturing.action]} → ${formatBinding(binding)}`
        );
      } else {
        const next = stages.map((s) =>
          s.id === capturing.stageId
            ? {
                ...s,
                shortcuts: {
                  ...s.shortcuts,
                  [capturing.field]: binding,
                },
              }
            : s
        );
        saveStages(next);
        onStagesChange(next);
        const stage = next.find((s) => s.id === capturing.stageId);
        onStatus(
          `Updated: ${stage?.label} ${capturing.field} → ${formatBinding(binding)}`
        );
      }

      setCapturing(null);
      setError(null);
    },
    [
      capturing,
      shortcuts,
      stages,
      onShortcutsChange,
      onStagesChange,
      onStatus,
      validateBinding,
    ]
  );

  useEffect(() => {
    if (!capturing) return;
    window.addEventListener("keydown", handleCapture, true);
    return () => window.removeEventListener("keydown", handleCapture, true);
  }, [capturing, handleCapture]);

  function handleResetShortcuts() {
    const defaults = resetShortcuts();
    onShortcutsChange(defaults);
    onStatus("Shortcuts reset to defaults");
    setCapturing(null);
    setError(null);
  }

  function handleResetStages() {
    const defaults = resetStages();
    onStagesChange(defaults);
    onStatus("Stages reset to defaults");
    setEditingId(null);
    setDeleteId(null);
  }

  function handleAddStage() {
    const maxOrder = sorted.reduce((m, s) => Math.max(m, s.order), -1);
    const stage = createStage({ order: maxOrder + 1 });
    const next = [...stages, stage];
    saveStages(next);
    onStagesChange(next);
    setEditingId(stage.id);
    onStatus("Added stage — set label and hotkeys");
  }

  function handleSaveEdit(stage: StageDefinition) {
    const next = stages.map((s) => (s.id === stage.id ? stage : s));
    saveStages(next);
    onStagesChange(next);
    setEditingId(null);
    onStatus(`Saved ${stage.label}`);
  }

  function handleDelete(stageId: string) {
    if (stages.length <= 1) {
      setError("Cannot delete the only stage.");
      return;
    }
    const count = countItemsInStage(items, stageId);
    if (count > 0 && !fallbackId) {
      setDeleteId(stageId);
      setFallbackId(sorted.find((s) => s.id !== stageId)?.id ?? "");
      return;
    }
    onDeleteStage(stageId, fallbackId || sorted.find((s) => s.id !== stageId)!.id);
    setDeleteId(null);
    setFallbackId("");
    setEditingId(null);
  }

  const editingStage = editingId
    ? stages.find((s) => s.id === editingId)
    : null;

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <header
        className="panel-border-b shrink-0 px-4 py-2"
        style={{ background: "var(--bg-elevated)" }}
      >
        <div className="font-mono-ui text-[11px] tracking-wider text-[var(--text-muted)]">
          SETTINGS
        </div>
        <div className="mt-2 flex gap-1 font-mono-ui text-xs">
          {(["shortcuts", "stages"] as SettingsTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                setCapturing(null);
                setError(null);
              }}
              className="px-2 py-1"
              style={{
                background: tab === t ? "var(--bg-selected)" : undefined,
                color:
                  tab === t ? "var(--text-primary)" : "var(--text-muted)",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {tab === "shortcuts" && (
          <>
            <div
              className="mb-3 grid grid-cols-[1fr_auto] gap-x-4 font-mono-ui text-[10px] uppercase tracking-wider"
              style={{ color: "var(--text-dim)" }}
            >
              <span>Action</span>
              <span>Binding</span>
            </div>
            <div
              className="mb-4 font-mono-ui text-xs"
              style={{ borderTop: "1px solid var(--border-subtle)" }}
            >
              {SHORTCUT_ACTIONS.map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => {
                    setCapturing({ type: "shortcut", action });
                    setError(null);
                  }}
                  className="grid w-full grid-cols-[1fr_auto] gap-x-4 border-b py-2 text-left hover:bg-[var(--bg-hover)]"
                  style={{
                    borderColor: "var(--border-subtle)",
                    background:
                      capturing?.type === "shortcut" &&
                      capturing.action === action
                        ? "var(--bg-selected)"
                        : undefined,
                    color: "var(--text-muted)",
                  }}
                >
                  <span>{SHORTCUT_LABELS[action]}</span>
                  <span style={{ color: "var(--text-primary)" }}>
                    {capturing?.type === "shortcut" &&
                    capturing.action === action
                      ? "Press keys…"
                      : formatBinding(shortcuts[action])}
                  </span>
                </button>
              ))}
              <div
                className="grid grid-cols-[1fr_auto] gap-x-4 py-2"
                style={{ color: "var(--text-dim)" }}
              >
                <span>Open Settings (fixed)</span>
                <span>{formatOpenSettingsBinding()}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetShortcuts}
              className="font-mono-ui text-xs hover:underline"
              style={{ color: "var(--text-muted)" }}
            >
              reset shortcuts to defaults
            </button>
          </>
        )}

        {tab === "stages" && (
          <>
            <div
              className="mb-3 font-mono-ui text-[10px] uppercase tracking-wider"
              style={{ color: "var(--text-dim)" }}
            >
              Stages · view / move hotkeys
            </div>
            <div
              className="mb-4 space-y-0 font-mono-ui text-xs"
              style={{ borderTop: "1px solid var(--border-subtle)" }}
            >
              {sorted.map((stage, idx) => (
                <div
                  key={stage.id}
                  className="border-b py-2"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  {editingId === stage.id && editingStage ? (
                    <StageEditor
                      stage={editingStage}
                      capturing={capturing}
                      onCaptureView={() => {
                        setCapturing({
                          type: "stage",
                          stageId: stage.id,
                          field: "view",
                        });
                        setError(null);
                      }}
                      onCaptureMove={() => {
                        setCapturing({
                          type: "stage",
                          stageId: stage.id,
                          field: "moveTo",
                        });
                        setError(null);
                      }}
                      onSave={handleSaveEdit}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span style={{ color: stage.color }}>{stage.glyph}</span>
                      <span
                        className="flex-1 truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {stage.label}
                      </span>
                      <span
                        className="text-[10px]"
                        style={{ color: "var(--text-dim)" }}
                      >
                        {formatBinding(stage.shortcuts.view)} /{" "}
                        {formatBinding(stage.shortcuts.moveTo)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingId(stage.id)}
                        className="px-1 hover:underline"
                        style={{ color: "var(--text-muted)" }}
                      >
                        edit
                      </button>
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => {
                          const next = reorderStages(stages, stage.id, "up");
                          saveStages(next);
                          onStagesChange(next);
                        }}
                        className="px-1 disabled:opacity-30"
                        style={{ color: "var(--text-dim)" }}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={idx === sorted.length - 1}
                        onClick={() => {
                          const next = reorderStages(stages, stage.id, "down");
                          saveStages(next);
                          onStagesChange(next);
                        }}
                        className="px-1 disabled:opacity-30"
                        style={{ color: "var(--text-dim)" }}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(stage.id)}
                        className="px-1 hover:underline"
                        style={{ color: "#f87171" }}
                      >
                        del
                      </button>
                    </div>
                  )}
                  {deleteId === stage.id && (
                    <div className="mt-2 space-y-2 pl-4">
                      <p style={{ color: "var(--text-muted)" }}>
                        {countItemsInStage(items, stage.id)} item(s) — reassign
                        to:
                      </p>
                      <select
                        value={fallbackId}
                        onChange={(e) => setFallbackId(e.target.value)}
                        className="w-full rounded-sm border px-2 py-1 text-xs"
                        style={{
                          borderColor: "var(--border-subtle)",
                          background: "var(--bg-base)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {sorted
                          .filter((s) => s.id !== stage.id)
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleDelete(stage.id)}
                          className="text-xs"
                          style={{ color: "#f87171" }}
                        >
                          confirm delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(null)}
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleAddStage}
                className="font-mono-ui text-xs hover:underline"
                style={{ color: "var(--text-muted)" }}
              >
                + add stage
              </button>
              <button
                type="button"
                onClick={handleResetStages}
                className="font-mono-ui text-xs hover:underline"
                style={{ color: "var(--text-muted)" }}
              >
                reset stages to defaults
              </button>
            </div>
          </>
        )}

        {error && (
          <p className="mt-3 font-mono-ui text-xs" style={{ color: "#f87171" }}>
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

function StageEditor({
  stage,
  capturing,
  onCaptureView,
  onCaptureMove,
  onSave,
  onCancel,
}: {
  stage: StageDefinition;
  capturing: CaptureTarget | null;
  onCaptureView: () => void;
  onCaptureMove: () => void;
  onSave: (stage: StageDefinition) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(stage);

  useEffect(() => {
    setDraft(stage);
  }, [stage]);

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={draft.label}
        onChange={(e) => setDraft({ ...draft, label: e.target.value })}
        placeholder="Label"
        className="w-full rounded-sm border px-2 py-1 text-xs"
        style={{
          borderColor: "var(--border-subtle)",
          background: "var(--bg-base)",
          color: "var(--text-primary)",
        }}
      />
      <input
        type="text"
        value={draft.subtitle}
        onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
        placeholder="Subtitle"
        className="w-full rounded-sm border px-2 py-1 text-xs"
        style={{
          borderColor: "var(--border-subtle)",
          background: "var(--bg-base)",
          color: "var(--text-primary)",
        }}
      />
      <div className="flex gap-2">
        <input
          type="text"
          value={draft.glyph}
          maxLength={2}
          onChange={(e) =>
            setDraft({ ...draft, glyph: e.target.value.slice(0, 2) })
          }
          placeholder="?"
          className="w-12 rounded-sm border px-2 py-1 text-xs"
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--bg-base)",
            color: draft.color,
          }}
        />
        <input
          type="color"
          value={draft.color}
          onChange={(e) => setDraft({ ...draft, color: e.target.value })}
          className="h-7 w-10 cursor-pointer rounded-sm border-0 bg-transparent"
        />
        <input
          type="text"
          value={draft.color}
          onChange={(e) => setDraft({ ...draft, color: e.target.value })}
          className="flex-1 rounded-sm border px-2 py-1 text-xs font-mono-ui"
          style={{
            borderColor: "var(--border-subtle)",
            background: "var(--bg-base)",
            color: "var(--text-primary)",
          }}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCaptureView}
          className="flex-1 rounded-sm border px-2 py-1 text-left text-[10px]"
          style={{
            borderColor: "var(--border-subtle)",
            background:
              capturing?.type === "stage" &&
              capturing.stageId === stage.id &&
              capturing.field === "view"
                ? "var(--bg-selected)"
                : "var(--bg-base)",
            color: "var(--text-muted)",
          }}
        >
          view:{" "}
          {capturing?.type === "stage" &&
          capturing.stageId === stage.id &&
          capturing.field === "view"
            ? "Press keys…"
            : formatBinding(draft.shortcuts.view)}
        </button>
        <button
          type="button"
          onClick={onCaptureMove}
          className="flex-1 rounded-sm border px-2 py-1 text-left text-[10px]"
          style={{
            borderColor: "var(--border-subtle)",
            background:
              capturing?.type === "stage" &&
              capturing.stageId === stage.id &&
              capturing.field === "moveTo"
                ? "var(--bg-selected)"
                : "var(--bg-base)",
            color: "var(--text-muted)",
          }}
        >
          move:{" "}
          {capturing?.type === "stage" &&
          capturing.stageId === stage.id &&
          capturing.field === "moveTo"
            ? "Press keys…"
            : formatBinding(draft.shortcuts.moveTo)}
        </button>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSave(draft)}
          disabled={!draft.label.trim()}
          className="text-xs disabled:opacity-40"
          style={{ color: "var(--accent-test)" }}
        >
          save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          cancel
        </button>
      </div>
    </div>
  );
}
