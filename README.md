# Modeflow

A personal **cognitive operating environment** for technical work. Modeflow is not a kanban board or project-management dashboard—it is a keyboard-first, terminal-inspired workspace built around how you actually think when coding and building.

## About the project

Most todo apps organize work by **status** (todo / in progress / done). Modeflow organizes work by **cognitive mode**—stages you define (defaults: Explore, Build, Test):

| Default stage | Glyph | Typical use |
|---------------|-------|-------------|
| **Explore** | `?` | Unsure, need research, or waiting on external input |
| **Build** | `~` | Know how to do it—execution, repetition, or waiting |
| **Test** | `✓` | Built something; still need to validate before dropping it mentally |

You can add, edit, reorder, or remove stages in **Settings → stages**. Each stage has its own **view** and **move to** hotkeys.

The goal is to reduce context switching and “task administration fatigue.” When research is really Explore work, you are not failing at Build—you are in the right mode. When validation piles up, Test holds it visibly until you archive and move on.

### Interface

- **Left sidebar** — your stages (configurable), Archive, and Settings; export/import backups
- **Center pane** — a single-stage queue of compact rows (one mental workspace at a time)
- **Right pane** — notes, links, and validation checklist for every item
- **Status bar** — hints and short feedback messages (no modal dialogs)

Data is stored in your browser (`localStorage`). Use **export** / **import** in the sidebar to back up or move data between machines.

### Stack

- [Next.js](https://nextjs.org) 16 (App Router)
- React 19, TypeScript, Tailwind CSS 4

---

## Prerequisites and setup

### Prerequisites

- **Node.js** 18.18 or later (20+ recommended)
- **npm** (comes with Node), or yarn / pnpm / bun

### Install and run

```bash
# Clone the repo, then from the project root:
npm install

# Development (hot reload)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Other commands

```bash
npm run build   # Production build
npm run start   # Run production server (after build)
npm run lint    # ESLint
```

There is no database or `.env` file required for local use.

---

## How to use

### Layout at a glance

1. Pick a **stage** in the sidebar. The center list shows only items in that stage.
2. Select a row to open its **context** on the right—notes, links, and checklist.
3. Add items with the `_` prompt at the bottom of the center pane, or press `n`.
4. **Archive** any item when you are done with it (`a` or context pane)—find it later under **Archive**.

### Mouse basics

- Click a sidebar mode to switch workspace
- Click a queue row to select it; **double-click** a row to rename the title
- Edit notes, links, and checklist in the right pane (saved when you leave the field)
- Use `→ [stage]` in the context header to move an item, or **archive** from any stage
- **export** / **import** in the sidebar for JSON backups (`modeflow-backup-YYYY-MM-DD.json`)

### Settings and customizable shortcuts

Open **Settings** with **`Ctrl+,`** (fixed, not rebindable) or click **Settings** in the sidebar.

**Shortcuts tab** — rebind global actions (navigate, new, archive, etc.).

**Stages tab** — add, edit, delete, and reorder stages. Set label, subtitle, glyph, color, and **view** / **move to** hotkeys per stage. Deleting a stage with items prompts you to reassign them. Minimum one stage required.

Storage keys:

- `modeflow:items:v1` — tasks
- `modeflow:shortcuts:v1` — global shortcuts
- `modeflow:stages:v1` — stage definitions and per-stage hotkeys

**Deselect:** While focused on the `_` new-item prompt, press **`Esc`** (configurable) to clear the draft, blur the input, and clear selection.

### Keyboard shortcuts

Press `?` to toggle the full shortcut list in the status bar (bindings reflect your Settings). The status bar always shows `Ctrl+, settings`.

Default **global** shortcuts (configurable in Settings → shortcuts):

| Action | Default |
|--------|---------|
| Navigate up / down | `k` / `j` (arrow keys also work) |
| New item | `n` |
| Edit title | `e` |
| Deselect / clear | `Esc` |
| View Archive | `4` |
| Archive item | `a` |
| Restore | `r` (Archive view) |
| Search archive | `/` |
| Toggle help | `?` |
| **Open Settings** | **`Ctrl+,`** (fixed) |

Default **per-stage** hotkeys (configurable in Settings → stages):

| Stage | View | Move item to |
|-------|------|--------------|
| Explore | `1` | `Shift+e` |
| Build | `2` | `b` |
| Test | `3` | `t` |

Shortcuts apply when you are not typing in a text field, except `/` in Archive (search) and `Esc` / `Ctrl+,` which work in more contexts.

In the center pane, type a title at `_` and press **Enter** to create an item in the current mode.

### Workflow example

1. **Explore** — `? research redis eviction policies` — add links and notes in the context pane
2. When you know what to do, move the item to **Build** (`b` or context actions)
3. After implementing, move to **Test** (`t`) — add a validation checklist and check items off
4. When validated, **archive** (`a`) — find it later via **Archive** and search

### Data and backups

- All items (active and archived) live in `localStorage` under the key `modeflow:items:v1`
- **Import** replaces all local data—export first if you need a safety copy
- Clearing site data for localhost will remove your items unless you have an export file

---

## Project structure

```
app/              # Next.js routes and global styles
components/       # UI shell (AppShell, Sidebar, QueuePane, ContextPane, …)
hooks/            # Keyboard handling
lib/              # Types, stages, localStorage, shortcuts, export/import
```

## License

Private project (`"private": true` in package.json). Adjust licensing as needed for your use.
