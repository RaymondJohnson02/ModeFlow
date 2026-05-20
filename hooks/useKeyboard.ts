"use client";

import { useEffect } from "react";
import type { AppView, Stage } from "@/lib/types";

function isTextInput(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return (el as HTMLElement).isContentEditable;
}

export type KeyboardActions = {
  view: AppView;
  onViewChange: (view: AppView) => void;
  onNavigateUp: () => void;
  onNavigateDown: () => void;
  onNewItem: () => void;
  onEditTitle: () => void;
  onMoveToStage: (stage: Stage) => void;
  onArchive: () => void;
  onRestore: () => void;
  onFocusArchiveSearch: () => void;
  onClearSelection: () => void;
  onToggleHelp: () => void;
};

export function useKeyboard(actions: KeyboardActions) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (!isTextInput(document.activeElement)) {
          actions.onClearSelection();
        }
        return;
      }

      if (e.key === "/" && actions.view === "archive") {
        e.preventDefault();
        actions.onFocusArchiveSearch();
        return;
      }

      if (isTextInput(document.activeElement)) return;

      const shift = e.shiftKey;

      switch (e.key) {
        case "j":
        case "ArrowDown":
          e.preventDefault();
          actions.onNavigateDown();
          break;
        case "k":
        case "ArrowUp":
          e.preventDefault();
          actions.onNavigateUp();
          break;
        case "n":
          e.preventDefault();
          actions.onNewItem();
          break;
        case "e":
          e.preventDefault();
          if (shift) {
            actions.onMoveToStage("explore");
          } else {
            actions.onEditTitle();
          }
          break;
        case "b":
          e.preventDefault();
          if (shift) {
            actions.onViewChange("build");
          } else {
            actions.onMoveToStage("build");
          }
          break;
        case "t":
          e.preventDefault();
          if (shift) {
            actions.onViewChange("test");
          } else {
            actions.onMoveToStage("test");
          }
          break;
        case "1":
          e.preventDefault();
          if (shift) actions.onMoveToStage("explore");
          else actions.onViewChange("explore");
          break;
        case "2":
          e.preventDefault();
          if (shift) actions.onMoveToStage("build");
          else actions.onViewChange("build");
          break;
        case "3":
          e.preventDefault();
          if (shift) actions.onMoveToStage("test");
          else actions.onViewChange("test");
          break;
        case "4":
          e.preventDefault();
          actions.onViewChange("archive");
          break;
        case "a":
          e.preventDefault();
          actions.onArchive();
          break;
        case "r":
          if (actions.view === "archive") {
            e.preventDefault();
            actions.onRestore();
          }
          break;
        case "?":
          e.preventDefault();
          actions.onToggleHelp();
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actions]);
}
