"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  archiveItem,
  loadItems,
  moveItem,
  restoreItem,
  saveItems,
  updateItem,
  upsertItem,
} from "@/lib/storage";
import {
  createItem,
  getMoveHint,
  isActive,
  stageFromView,
  type AppView,
  type Item,
  type Stage,
} from "@/lib/types";
import { useKeyboard } from "@/hooks/useKeyboard";
import { ArchiveQueue } from "./ArchiveQueue";
import { ContextPane } from "./ContextPane";
import { QueuePane } from "./QueuePane";
import { Sidebar } from "./Sidebar";
import { StatusBar } from "./StatusBar";

export function AppShell() {
  const [items, setItems] = useState<Item[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<AppView>("explore");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItemFocus, setNewItemFocus] = useState(false);
  const [archiveQuery, setArchiveQuery] = useState("");
  const [restoreStage, setRestoreStage] = useState<Stage>("test");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const newInputRef = useRef<HTMLInputElement>(null);
  const archiveSearchRef = useRef<HTMLInputElement>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setItems(loadItems());
    setHydrated(true);
  }, []);

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
    const list = archivedItems;
    if (!q) return list;
    return list.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        (i.notes?.toLowerCase().includes(q) ?? false)
    );
  }, [archivedItems, archiveQuery]);

  const currentList =
    view === "archive" ? filteredArchive : queueItems;

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId]
  );

  useEffect(() => {
    if (selectedId && !currentList.some((i) => i.id === selectedId)) {
      setSelectedId(currentList[0]?.id ?? null);
    }
  }, [currentList, selectedId]);

  useEffect(() => {
    setEditingId(null);
  }, [view]);

  const handleViewChange = useCallback((next: AppView) => {
    setView(next);
    setEditingId(null);
    setNewItemFocus(false);
  }, []);

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
      showStatus(`Created in ${stage}`);
    },
    [items, persist, showStatus, view]
  );

  const handleUpdate = useCallback(
    (id: string, patch: Partial<Item>) => {
      persist(updateItem(items, id, patch));
    },
    [items, persist]
  );

  const handleMove = useCallback(
    (id: string, to: Stage, shift = false) => {
      const item = items.find((i) => i.id === id);
      if (!item || item.stage === to) return;
      const hint = getMoveHint(item.stage, to);
      persist(moveItem(items, id, to));
      if (view !== to && view !== "archive") {
        setView(to);
      }
      if (hint && !shift) showStatus(hint);
      else showStatus(`Moved to ${to}`);
    },
    [items, persist, showStatus, view]
  );

  const handleArchive = useCallback(
    (id: string) => {
      const item = items.find((i) => i.id === id);
      if (!item || item.archivedAt) return;
      if (item.stage !== "test") {
        showStatus("Archive only from Test");
        return;
      }
      persist(archiveItem(items, id));
      setSelectedId(null);
      showStatus("Archived — off the queue");
    },
    [items, persist, showStatus]
  );

  const handleRestore = useCallback(
    (id: string, stage: Stage) => {
      persist(restoreItem(items, id, stage));
      setSelectedId(null);
      setView(stage);
      showStatus(`Restored to ${stage}`);
    },
    [items, persist, showStatus]
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
      onViewChange: handleViewChange,
      onNavigateUp: () => navigate(-1),
      onNavigateDown: () => navigate(1),
      onNewItem: () => {
        if (view === "archive") return;
        setNewItemFocus(true);
        setTimeout(() => newInputRef.current?.focus(), 0);
      },
      onEditTitle: () => {
        if (selectedId) setEditingId(selectedId);
      },
      onMoveToStage: (stage: Stage) => {
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
      onToggleHelp: () => setShowHelp((h) => !h),
    }),
    [
      view,
      handleViewChange,
      navigate,
      selectedId,
      handleMove,
      handleArchive,
      handleRestore,
      restoreStage,
      editingId,
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

  const stage = stageFromView(view);

  return (
    <div className="flex h-screen flex-col">
      <div className="flex min-h-0 flex-1">
        <Sidebar
          view={view}
          items={items}
          onViewChange={handleViewChange}
          onImport={(imported) => {
            persist(imported);
            showStatus(`Imported ${imported.length} items`);
          }}
          onStatus={showStatus}
        />

        {view === "archive" ? (
          <ArchiveQueue
            items={archivedItems}
            query={archiveQuery}
            selectedId={selectedId}
            searchRef={archiveSearchRef}
            onQueryChange={setArchiveQuery}
            onSelect={handleSelect}
          />
        ) : stage ? (
          <QueuePane
            stage={stage}
            items={queueItems}
            selectedId={selectedId}
            editingId={editingId}
            newItemFocus={newItemFocus}
            onSelect={handleSelect}
            onClearNewFocus={() => setNewItemFocus(false)}
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
      />
    </div>
  );
}
