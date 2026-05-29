"use client";

import { useEffect } from "react";
import { matchesOpenSettings } from "@/lib/fixedShortcuts";
import {
  bindingsEqual,
  findActionForEvent,
  matchesBinding,
  type ShortcutAction,
  type ShortcutMap,
} from "@/lib/shortcuts";
import { sortedStages, type StageDefinition } from "@/lib/stages";
import type { AppView, StageId } from "@/lib/types";

function isTextInput(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return (el as HTMLElement).isContentEditable;
}

function isNewItemInput(el: Element | null): boolean {
  return (
    el instanceof HTMLElement &&
    el.dataset.modeflow === "new-item-input"
  );
}

export type KeyboardActions = {
  view: AppView;
  shortcuts: ShortcutMap;
  stages: StageDefinition[];
  capturing: boolean;
  onViewChange: (view: AppView) => void;
  onNavigateUp: () => void;
  onNavigateDown: () => void;
  onNewItem: () => void;
  onEditTitle: () => void;
  onMoveToStage: (stage: StageId) => void;
  onArchive: () => void;
  onRestore: () => void;
  onFocusArchiveSearch: () => void;
  onClearSelection: () => void;
  onDeselect: () => void;
  onToggleHelp: () => void;
  onOpenSettings: () => void;
  onExitSettings: () => void;
};

function dispatchAction(action: ShortcutAction, actions: KeyboardActions): void {
  switch (action) {
    case "navigateUp":
      actions.onNavigateUp();
      break;
    case "navigateDown":
      actions.onNavigateDown();
      break;
    case "newItem":
      actions.onNewItem();
      break;
    case "editTitle":
      actions.onEditTitle();
      break;
    case "deselect":
      actions.onDeselect();
      break;
    case "clearSelection":
      if (actions.view === "settings") {
        actions.onExitSettings();
      } else {
        actions.onClearSelection();
      }
      break;
    case "viewArchive":
      actions.onViewChange("archive");
      break;
    case "archive":
      actions.onArchive();
      break;
    case "restore":
      actions.onRestore();
      break;
    case "searchArchive":
      actions.onFocusArchiveSearch();
      break;
    case "toggleHelp":
      actions.onToggleHelp();
      break;
    default:
      break;
  }
}

function findStageViewMatch(
  stages: StageDefinition[],
  e: KeyboardEvent
): StageDefinition | null {
  for (const stage of sortedStages(stages)) {
    if (stage.shortcuts.view.key && matchesBinding(e, stage.shortcuts.view)) {
      return stage;
    }
  }
  return null;
}

function findStageMoveMatch(
  stages: StageDefinition[],
  e: KeyboardEvent
): StageDefinition | null {
  for (const stage of sortedStages(stages)) {
    if (stage.shortcuts.moveTo.key && matchesBinding(e, stage.shortcuts.moveTo)) {
      return stage;
    }
  }
  return null;
}

export function useKeyboard(actions: KeyboardActions) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (matchesOpenSettings(e)) {
        e.preventDefault();
        if (actions.view === "settings") {
          actions.onExitSettings();
        } else {
          actions.onOpenSettings();
        }
        return;
      }

      if (actions.capturing) return;

      const active = document.activeElement;
      const inNewItemInput = isNewItemInput(active);

      const isDeselectKey =
        matchesBinding(e, actions.shortcuts.deselect) ||
        matchesBinding(e, actions.shortcuts.clearSelection);

      if (isDeselectKey) {
        e.preventDefault();
        if (inNewItemInput) {
          actions.onDeselect();
        } else if (actions.view === "settings") {
          actions.onExitSettings();
        } else {
          actions.onDeselect();
        }
        return;
      }

      if (inNewItemInput) {
        return;
      }

      if (
        actions.view === "archive" &&
        matchesBinding(e, actions.shortcuts.searchArchive)
      ) {
        e.preventDefault();
        actions.onFocusArchiveSearch();
        return;
      }

      if (isTextInput(active)) return;

      if (e.key === "ArrowUp") {
        e.preventDefault();
        actions.onNavigateUp();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        actions.onNavigateDown();
        return;
      }

      const moveStage = findStageMoveMatch(actions.stages, e);
      if (moveStage) {
        e.preventDefault();
        actions.onMoveToStage(moveStage.id);
        return;
      }

      const viewStage = findStageViewMatch(actions.stages, e);
      if (viewStage) {
        e.preventDefault();
        actions.onViewChange(viewStage.id);
        return;
      }

      const action = findActionForEvent(actions.shortcuts, e);
      if (!action) return;

      if (action === "restore" && actions.view !== "archive") return;
      if (action === "searchArchive" && actions.view !== "archive") return;
      if (
        action === "newItem" &&
        (actions.view === "archive" || actions.view === "settings")
      )
        return;

      e.preventDefault();
      dispatchAction(action, actions);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actions]);
}

export function bindingConflictsWithStages(
  stages: StageDefinition[],
  binding: import("@/lib/shortcuts").KeyBinding,
  excludeStageId?: string,
  excludeField?: "view" | "moveTo"
): string | null {
  for (const stage of stages) {
    if (stage.id === excludeStageId) {
      if (excludeField !== "view" && bindingsEqual(stage.shortcuts.view, binding)) {
        return `View ${stage.label}`;
      }
      if (excludeField !== "moveTo" && bindingsEqual(stage.shortcuts.moveTo, binding)) {
        return `Move to ${stage.label}`;
      }
    } else {
      if (bindingsEqual(stage.shortcuts.view, binding)) {
        return `View ${stage.label}`;
      }
      if (bindingsEqual(stage.shortcuts.moveTo, binding)) {
        return `Move to ${stage.label}`;
      }
    }
  }
  return null;
}
