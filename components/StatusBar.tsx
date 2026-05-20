"use client";

import type { AppView } from "@/lib/types";
import { STAGE_META } from "@/lib/types";

type StatusBarProps = {
  message: string | null;
  showHelp: boolean;
  view: AppView;
};

const HELP_LINES = [
  "j/k ↑↓ navigate · n new · e edit · Shift+e move explore",
  "b move build · Shift+b view build · t move test · Shift+t view test",
  "1/2/3 switch view · Shift+1/2/3 move item · 4 archive view",
  "a archive (test) · r restore · / search archive · Esc clear · ? help",
];

export function StatusBar({ message, showHelp, view }: StatusBarProps) {
  const viewLabel =
    view === "archive"
      ? "Archive"
      : STAGE_META[view].label.toUpperCase();

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
        <span className="truncate">{HELP_LINES.join(" · ")}</span>
      ) : (
        <span className="truncate opacity-70">
          n new · e edit · j/k nav · 1/2/3 views · ? help
        </span>
      )}
    </footer>
  );
}
