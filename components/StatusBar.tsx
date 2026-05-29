"use client";

import { formatOpenSettingsBinding } from "@/lib/fixedShortcuts";
import { formatBinding, type ShortcutMap } from "@/lib/shortcuts";
import { getStage, sortedStages, type StageDefinition } from "@/lib/stages";
import type { AppView } from "@/lib/types";

type StatusBarProps = {
  message: string | null;
  showHelp: boolean;
  view: AppView;
  shortcuts: ShortcutMap;
  stages: StageDefinition[];
};

function stageViewHints(stages: StageDefinition[]): string {
  return sortedStages(stages)
    .slice(0, 4)
    .map((s) => `${formatBinding(s.shortcuts.view)} ${s.label.toLowerCase()}`)
    .join(" · ");
}

function buildHelpLine(shortcuts: ShortcutMap, stages: StageDefinition[]): string {
  const parts = [
    `${formatBinding(shortcuts.newItem)} new`,
    `${formatBinding(shortcuts.editTitle)} edit`,
    `${formatBinding(shortcuts.navigateDown)}/${formatBinding(shortcuts.navigateUp)} nav`,
    stageViewHints(stages),
    `${formatBinding(shortcuts.toggleHelp)} help`,
    `${formatOpenSettingsBinding()} settings`,
  ];
  return parts.join(" · ");
}

function buildFullHelp(shortcuts: ShortcutMap, stages: StageDefinition[]): string {
  const stageParts = sortedStages(stages).flatMap((s) => [
    `${formatBinding(s.shortcuts.view)} view ${s.label}`,
    `${formatBinding(s.shortcuts.moveTo)} move ${s.label}`,
  ]);
  const parts = [
    `${formatBinding(shortcuts.navigateDown)}/${formatBinding(shortcuts.navigateUp)} ↑↓ navigate`,
    `${formatBinding(shortcuts.newItem)} new`,
    `${formatBinding(shortcuts.editTitle)} edit`,
    `${formatBinding(shortcuts.deselect)} deselect`,
    ...stageParts,
    `${formatBinding(shortcuts.viewArchive)} archive view`,
    `${formatBinding(shortcuts.archive)} archive item`,
    `${formatBinding(shortcuts.restore)} restore`,
    `${formatBinding(shortcuts.searchArchive)} search archive`,
    `${formatBinding(shortcuts.clearSelection)} clear`,
    `${formatBinding(shortcuts.toggleHelp)} help`,
    `${formatOpenSettingsBinding()} settings`,
  ];
  return parts.join(" · ");
}

export function StatusBar({
  message,
  showHelp,
  view,
  shortcuts,
  stages,
}: StatusBarProps) {
  const viewLabel =
    view === "archive"
      ? "Archive"
      : view === "settings"
        ? "Settings"
        : getStage(stages, view)?.label.toUpperCase() ?? view.toUpperCase();

  const defaultHint = buildHelpLine(shortcuts, stages);
  const fullHelp = buildFullHelp(shortcuts, stages);

  return (
    <footer
      className="panel-border-t flex h-7 shrink-0 items-center gap-4 px-3 font-mono-ui text-[11px]"
      style={{ background: "var(--bg-panel)", color: "var(--text-muted)" }}
    >
      <span style={{ color: "var(--text-dim)" }}>{viewLabel}</span>
      {message ? (
        <span className="truncate" style={{ color: "var(--text-primary)" }}>
          {message}
        </span>
      ) : showHelp ? (
        <span className="truncate">{fullHelp}</span>
      ) : (
        <span className="truncate opacity-70">{defaultHint}</span>
      )}
    </footer>
  );
}
