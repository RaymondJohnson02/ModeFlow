"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useKeyboard } from "@/hooks/useKeyboard";
import { loadShortcuts } from "@/lib/settingsStorage";
import type { ShortcutMap } from "@/lib/shortcuts";
import {
  getStage,
  sortedStages,
  type StageDefinition,
} from "@/lib/stages";
import {
  firstStageId,
  lastStageId,
  loadStages,
  saveStages,
} from "@/lib/stagesStorage";
import {
  archiveItem,
  loadItems,
  moveItem,
  normalizeItems,
  reassignStage,
  restoreItem,
  saveItems,
  updateItem,
  upsertItem,
} from "@/lib/storage";
import {
  createItem,
  isActive,
  isStageView,
  stageFromView,
  type AppView,
  type Item,
  type StageId,
} from "@/lib/types";
import { ArchiveQueue } from "./ArchiveQueue";
import { ContextPane } from "./ContextPane";
import { QueuePane } from "./QueuePane";
import { SettingsPane } from "./SettingsPane";
import { Sidebar } from "./Sidebar";
import { StatusBar } from "./StatusBar";

export function AppShell() {
  const [stages, setStages] = useState<StageDefinition[]>(() => loadStages());
  const [items, setItems] = useState<Item[]>([]);
  const [shortcuts, setShortcuts] = useState<ShortcutMap>(() => loadShortcuts());
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<AppView>(() => firstStageId(loadStages()));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItemFocus, setNewItemFocus] = useState(false);
  const [archiveQuery, setArchiveQuery] = useState("");
  const [restoreStage, setRestoreStage] = useState<StageId>(() =>
    lastStageId(loadStages())
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [capturingShortcut, setCapturingShortcut] = useState(false);

  const previousViewRef = useRef<AppView>(firstStageId(loadStages()));
  const newInputRef = useRef<HTMLInputElement>(null);
  const archiveSearchRef = useRef<HTMLInputElement>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const orderedStages = useMemo(() => sortedStages(stages), [stages]);
  const stageIds = useMemo(() => orderedStages.map((s) => s.id), [orderedStages]);

  useEffect(() => {
    const loadedStages = loadStages();
    setStages(loadedStages);
    setItems(normalizeItems(loadItems(), loadedStages.map((s) => s.id)));
    setShortcuts(loadShortcuts());
    setView((v) => {
      if (v === "archive" || v === "settings") return v;
      return loadedStages.some((s) => s.id === v)
        ? v
        : firstStageId(loadedStages);
    });
    setRestoreStage(lastStageId(loadedStages));
    previousViewRef.current = firstStageId(loadedStages);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (view !== "archive" && view !== "settings" && !stageIds.includes(view)) {
      setView(firstStageId(stages));
    }
  }, [stageIds, stages, view]);

  const showStatus = useCallback((msg: string) => {
    setStatusMessage(msg);
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    statusTimerRef.current = setTimeout(() => setStatusMessage(null), 3000);
  }, []);

  const persist = useCallback(
    (next: Item[]) => {
      setItems(next);
      saveItems(next);
    },
    []
  );

  const activeItems = useMemo(() => items.filter(isActive), [items]);
  const archivedItems = useMemo(
    () => items.filter((i) => !isActive(i)),
    [items]
  );

  const queueItems = useMemo(() => {
    const stage = stageFromView(view);
    if (!stage) return [];
    return activeItems.filter((i) => i.stage === stage);
  }, [activeItems, view]);

  const filteredArchive = useMemo(() => {
    const q = archiveQuery.trim().toLowerCase();
    if (!q) return archivedItems;
    return archivedItems.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        (i.notes?.toLowerCase().includes(q) ?? false)
    );
  }, [archivedItems, archiveQuery]);

  const currentList = view === "archive" ? filteredArchive : queueItems;

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId]
  );

  const currentStageDef = isStageView(view)
    ? getStage(stages, view)
    : undefined;

  useEffect(() => {
    if (view === "settings") return;
    if (selectedId && !currentList.some((i) => i.id === selectedId)) {
      setSelectedId(currentList[0]?.id ?? null);
    }
  }, [currentList, selectedId, view]);

  useEffect(() => {
    setEditingId(null);
    if (view === "settings") setSelectedId(null);
  }, [view]);

  const handleDeselect = useCallback(() => {
    setSelectedId(null);
    setEditingId(null);
    setNewItemFocus(false);
    setShowHelp(false);
    if (newInputRef.current) {
      newInputRef.current.value = "";
      newInputRef.current.blur();
    }
  }, []);

  const handleOpenSettings = useCallback(() => {
    if (view !== "settings") {
      previousViewRef.current = view;
    }
    setView("settings");
    setSelectedId(null);
    setEditingId(null);
    setNewItemFocus(false);
  }, [view]);

  const handleExitSettings = useCallback(() => {
    setView(previousViewRef.current);
    setSelectedId(null);
  }, []);

  const handleViewChange = useCallback(
    (next: AppView) => {
      if (next !== "settings" && view === "settings") {
        previousViewRef.current = next;
      }
      if (next === "settings" && view !== "settings") {
        previousViewRef.current = view;
      }
      setView(next);
      setEditingId(null);
      setNewItemFocus(false);
    },
    [view]
  );

  const handleStagesChange = useCallback(
    (next: StageDefinition[]) => {
      setStages(next);
      setItems((prev) => normalizeItems(prev, next.map((s) => s.id)));
      if (isStageView(view) && !next.some((s) => s.id === view)) {
        setView(firstStageId(next));
      }
    },
    [view]
  );

  const handleDeleteStage = useCallback(
    (stageId: StageId, fallbackId: StageId) => {
      const nextStages = orderedStages.filter((s) => s.id !== stageId);
      if (nextStages.length === 0) return;
      const nextItems = reassignStage(items, stageId, fallbackId);
      saveStages(nextStages);
      persist(nextItems);
      setStages(nextStages);
      if (view === stageId) setView(fallbackId);
      if (restoreStage === stageId) setRestoreStage(fallbackId);
      showStatus("Stage deleted, items reassigned");
    },
    [orderedStages, items, persist, view, restoreStage, showStatus]
  );

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setEditingId(null);
  }, []);

  const handleCreate = useCallback(
    (title: string) => {
      const stage = stageFromView(view);
      if (!stage) return;
      const item = createItem(title, stage);
      const next = upsertItem(items, item);
      persist(next);
      setSelectedId(item.id);
      showStatus(`Created in ${getStage(stages, stage)?.label ?? stage}`);
    },
    [items, persist, showStatus, stages, view]
  );

  const handleUpdate = useCallback(
    (id: string, patch: Partial<Item>) => {
      persist(updateItem(items, id, patch));
    },
    [items, persist]
  );

  const handleMove = useCallback(
    (id: string, to: StageId) => {
      const item = items.find((i) => i.id === id);
      if (!item || item.stage === to) return;
      persist(moveItem(items, id, to));
      const label = getStage(stages, to)?.label ?? to;
      showStatus(`Moved to ${label}`);
    },
    [items, persist, showStatus, stages]
  );

  const handleArchive = useCallback(
    (id: string) => {
      const item = items.find((i) => i.id === id);
      if (!item || item.archivedAt) return;
      persist(archiveItem(items, id));
      setSelectedId(null);
      showStatus("Archived — off the queue");
    },
    [items, persist, showStatus]
  );

  const handleRestore = useCallback(
    (id: string, stage: StageId) => {
      persist(restoreItem(items, id, stage));
      setSelectedId(null);
      setView(stage);
      showStatus(`Restored to ${getStage(stages, stage)?.label ?? stage}`);
    },
    [items, persist, showStatus, stages]
  );

  const navigate = useCallback(
    (direction: 1 | -1) => {
      if (currentList.length === 0) {
        setSelectedId(null);
        return;
      }
      const idx = selectedId
        ? currentList.findIndex((i) => i.id === selectedId)
        : -1;
      let next = idx + direction;
      if (next < 0) next = currentList.length - 1;
      if (next >= currentList.length) next = 0;
      setSelectedId(currentList[next].id);
      setEditingId(null);
    },
    [currentList, selectedId]
  );

  const keyboardActions = useMemo(
    () => ({
      view,
      shortcuts,
      stages: orderedStages,
      capturing: capturingShortcut,
      onViewChange: handleViewChange,
      onNavigateUp: () => navigate(-1),
      onNavigateDown: () => navigate(1),
      onNewItem: () => {
        if (view === "archive" || view === "settings") return;
        setNewItemFocus(true);
        setTimeout(() => newInputRef.current?.focus(), 0);
      },
      onEditTitle: () => {
        if (selectedId) setEditingId(selectedId);
      },
      onMoveToStage: (stage: StageId) => {
        if (selectedId) handleMove(selectedId, stage);
      },
      onArchive: () => {
        if (selectedId) handleArchive(selectedId);
      },
      onRestore: () => {
        if (selectedId && view === "archive") {
          handleRestore(selectedId, restoreStage);
        }
      },
      onFocusArchiveSearch: () => archiveSearchRef.current?.focus(),
      onClearSelection: () => {
        setEditingId(null);
        setNewItemFocus(false);
        if (editingId) return;
        setSelectedId(null);
        setShowHelp(false);
      },
      onDeselect: handleDeselect,
      onToggleHelp: () => setShowHelp((h) => !h),
      onOpenSettings: handleOpenSettings,
      onExitSettings: handleExitSettings,
    }),
    [
      view,
      shortcuts,
      orderedStages,
      capturingShortcut,
      handleViewChange,
      navigate,
      selectedId,
      handleMove,
      handleArchive,
      handleRestore,
      restoreStage,
      editingId,
      handleDeselect,
      handleOpenSettings,
      handleExitSettings,
    ]
  );

  useKeyboard(keyboardActions);

  if (!hydrated) {
    return (
      <div
        className="flex h-screen items-center justify-center font-mono-ui text-xs"
        style={{ color: "var(--text-dim)" }}
      >
        loading…
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex min-h-0 flex-1">
        <Sidebar
          view={view}
          stages={orderedStages}
          items={items}
          onViewChange={handleViewChange}
          onImport={(imported) => {
            persist(normalizeItems(imported, stageIds));
            showStatus(`Imported ${imported.length} items`);
          }}
          onStatus={showStatus}
        />

        {view === "settings" ? (
          <SettingsPane
            shortcuts={shortcuts}
            stages={orderedStages}
            items={items}
            onShortcutsChange={setShortcuts}
            onStagesChange={handleStagesChange}
            onDeleteStage={handleDeleteStage}
            onStatus={showStatus}
            onCapturingChange={setCapturingShortcut}
          />
        ) : view === "archive" ? (
          <ArchiveQueue
            items={archivedItems}
            stages={orderedStages}
            query={archiveQuery}
            selectedId={selectedId}
            searchRef={archiveSearchRef}
            onQueryChange={setArchiveQuery}
            onSelect={handleSelect}
          />
        ) : currentStageDef ? (
          <QueuePane
            stage={currentStageDef}
            stages={orderedStages}
            items={queueItems}
            selectedId={selectedId}
            editingId={editingId}
            newItemFocus={newItemFocus}
            onSelect={handleSelect}
            onClearNewFocus={() => setNewItemFocus(false)}
            onDeselect={handleDeselect}
            onCreate={handleCreate}
            onSaveTitle={(id, title) => {
              handleUpdate(id, { title });
              setEditingId(null);
            }}
            onStartEdit={(id) => setEditingId(id)}
            onCancelEdit={() => setEditingId(null)}
            newInputRef={newInputRef}
          />
        ) : null}

        <ContextPane
          view={view}
          stages={orderedStages}
          item={selectedItem}
          restoreStage={restoreStage}
          onRestoreStageChange={setRestoreStage}
          onUpdate={handleUpdate}
          onRestore={handleRestore}
          onArchive={handleArchive}
          onMove={(id, to) => handleMove(id, to)}
        />
      </div>

      <StatusBar
        message={statusMessage}
        showHelp={showHelp}
        view={view}
        shortcuts={shortcuts}
        stages={orderedStages}
      />
    </div>
  );
}
