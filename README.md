# Modeflow

A personal **cognitive operating environment** for technical work. Modeflow is not a kanban board or project-management dashboard—it is a keyboard-first, terminal-inspired workspace built around how you actually think when coding and building.

## About the project

Most todo apps organize work by **status** (todo / in progress / done). Modeflow organizes work by **cognitive mode**:

| Mode | Glyph | When to use it |
|------|-------|----------------|
| **Explore** | `?` | You are unsure, need research, or are waiting on external input |
| **Build** | `~` | You know how to do it—execution, repetition, or waiting time |
| **Test** | `✓` | You have built something but still need to validate it before you can drop it mentally |

The goal is to reduce context switching and “task administration fatigue.” When research is really Explore work, you are not failing at Build—you are in the right mode. When validation piles up, Test holds it visibly until you archive and move on.

### Interface

- **Left sidebar** — switch modes (Explore, Build, Test) and open Archive; export/import backups
- **Center pane** — a single-mode queue of compact rows (one mental workspace at a time)
- **Right pane** — notes, links, and validation checklist for the selected item
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

1. Pick a mode in the **sidebar** (Explore, Build, or Test). The center list shows only items in that mode.
2. Select a row to open its **context** on the right—notes, links (Explore), validation checklist (Test).
3. Add items with the `_` prompt at the bottom of the center pane, or press `n`.
4. When something passes validation in **Test**, **archive** it so it leaves the queue but stays searchable under **Archive**.

### Mouse basics

- Click a sidebar mode to switch workspace
- Click a queue row to select it; **double-click** a row to rename the title
- Edit notes, links, and checklist in the right pane (saved when you leave the field)
- Use `→ Build` / `→ Test` etc. in the context header to move an item, or **archive** when in Test
- **export** / **import** in the sidebar for JSON backups (`modeflow-backup-YYYY-MM-DD.json`)

### Keyboard shortcuts

Press `?` in the app to toggle the full shortcut list in the status bar. Shortcuts apply when you are not typing in an input (except `/` in Archive, which always focuses search).

| Key | Action |
|-----|--------|
| `j` / `k` or `↑` / `↓` | Move selection in the queue |
| `n` | Focus new-item input (`_` prompt) |
| `e` | Edit selected title |
| `Shift+e` | Move selected item to Explore |
| `b` | Move selected item to Build |
| `Shift+b` | Switch view to Build |
| `t` | Move selected item to Test |
| `Shift+t` | Switch view to Test |
| `1` / `2` / `3` | Switch view to Explore / Build / Test |
| `Shift+1` / `Shift+2` / `Shift+3` | Move selected item to Explore / Build / Test |
| `4` | Open Archive view |
| `a` | Archive selected item (Test items only) |
| `r` | Restore selected item (in Archive view) |
| `/` | Focus archive search |
| `Esc` | Clear selection / cancel edit |
| `?` | Toggle shortcut help |

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
lib/              # Types, localStorage, JSON export/import
```

## License

Private project (`"private": true` in package.json). Adjust licensing as needed for your use.
