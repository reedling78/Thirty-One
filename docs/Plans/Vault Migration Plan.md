# Vault Migration Plan

Move the Obsidian vault (`~/Documents/ThirtyOne`) into the code repo at `~/Documents/Github/Thirty-One/docs/`, so everything — notes, plans, design decisions, and the Claude Design canvas source — is versioned and backed up on GitHub alongside the code. After the move the repo is the only copy; Obsidian opens `docs/` as the vault.

Decided 2026-10-13. Steps 1–5 done 2026-10-13 on branch `chore/docs-vault`. Related: [[Design Plan]] › Where the design lives, [[Design]].

## What exists today

The vault is 51 files, 12 MB, of which 10 MB is junk that must not be committed (`.copilot/model-catalog-cache.json` at 5.1 MB and the Copilot plugin bundle `.obsidian/plugins/copilot/main.js` at 4.8 MB). The real content is 22 markdown notes across `Design/`, `Notes/`, `Plans/`, `raw/`, plus the icon PNGs and the eight sounds under `Design/`.

Everything in `Design/icon/` and `Design/sounds/` is byte-identical to the copies already in `apps/mobile/assets/`. `Design/tokens.ts` and `Design/cardArt.ts` have drifted from `apps/mobile/src/theme/` — the app copies are the live ones, as [[Design]] already says.

The Claude Design canvas (https://claude.ai/artifact/LACRZUeD3uPc36K4BCnXW9) has no uploaded assets; its substance is 26 artboards (`project/*.dc.html`) plus `project/canvas.json`. Those files are the design source and are what gets pulled into the repo.

## Target layout

```
Thirty-One/
  docs/                      ← Obsidian vault root
    .obsidian/               ← settings only (see .gitignore below)
    Design/
      Design.md, Card Spec.md, Feedback Spec.md, Build Prompt.md, Update 2026-10-12*.md
      canvas/                ← Claude Design source: canvas.json + 26 *.dc.html artboards
    Notes/                   ← App Features, Rules, Tech Stack
    Plans/                   ← Scope, Design Brief, Design Plan, Implementation Plan, Project Review, Before Building, this file
    raw/                     ← App.md, Rules.md (early drafts, kept for history)
```

Dropped on purpose: `.copilot/` (model cache), `copilot/` (Copilot chat transcripts and `copilot/projects/ThirtyOne/.claude/settings.local.json`), `.DS_Store`, `.obsidian/workspace.json` (per-machine window state), `.obsidian/plugins/` (binaries, and Copilot's `data.json` holds API keys — never commit it; `community-plugins.json` records which plugins to reinstall).

Also dropped: `Design/icon/`, `Design/sounds/`, `Design/tokens.ts`, `Design/cardArt.ts`. They are duplicates (or stale duplicates) of files that now live in the same repo, so [[Design]] and [[Card Spec]] link to the app paths instead. If you would rather keep the reference copies in `docs/Design/`, skip step 3 — nothing else depends on it.

## Steps

### 1. Branch from main

`design/oct-12-updates` doesn't touch `docs/`, so this branch can land before or after it without conflict.

```bash
cd ~/Documents/Github/Thirty-One
git fetch origin
git switch main && git pull --ff-only
git switch -c chore/docs-vault
```

### 2. Copy the vault in (Claude does this via the linked folders)

rsync with the exclusions above into `docs/`. Nothing is deleted from `~/Documents/ThirtyOne` yet.

```bash
rsync -av \
  --exclude '.DS_Store' --exclude '.copilot/' --exclude 'copilot/' \
  --exclude '.obsidian/workspace.json' --exclude '.obsidian/plugins/' \
  ~/Documents/ThirtyOne/ ~/Documents/Github/Thirty-One/docs/
```

### 3. Remove the duplicated assets and repoint the links (Claude)

Delete `docs/Design/icon/`, `docs/Design/sounds/`, `docs/Design/tokens.ts`, `docs/Design/cardArt.ts` from the copy. Edit `docs/Design/Design.md` and `docs/Design/Card Spec.md` so references to "`tokens.ts` in this folder" become relative links to `../../apps/mobile/src/theme/tokens.ts` (and likewise for `cardArt.ts`, icons, sounds).

### 4. Pull the Claude Design canvas source into `docs/Design/canvas/` (Claude)

Read `project/canvas.json` and the 26 `project/*.dc.html` files from the artifact and write them to `docs/Design/canvas/`, with a short `README.md` there naming the canvas URL and the version they were taken from. These are the editable source; re-pull whenever the canvas changes. Optionally export the artboards as PNG/PDF from the canvas by hand and drop them in `docs/Design/canvas/exports/` for people without Claude access.

### 5. Repo housekeeping (Claude)

Append to `.gitignore`:

```
# Obsidian vault in docs/
docs/.obsidian/workspace.json
docs/.obsidian/plugins/
docs/.copilot/
```

Add `docs/` to `.prettierignore` so `pnpm check` doesn't reformat Obsidian markdown (wiki-links, callouts). Replace the README "Design docs" section with: "Rules, features, stack decisions and plans live in `docs/`, an Obsidian vault — open that folder in Obsidian."

### 6. Review, commit, push, PR (Reed, in Terminal)

```bash
cd ~/Documents/Github/Thirty-One
git status
git ls-files --others --exclude-standard docs | grep -Ei 'data\.json|\.key|secret' || echo "no secrets staged"
du -sh docs
git add -A
git commit -m "Move the Obsidian vault into docs/ with the Claude Design canvas source"
git push -u origin chore/docs-vault
gh pr create --fill --base main
```

Merge the PR, then:

```bash
git switch main && git pull --ff-only
```

### 7. Repoint Obsidian (Reed)

In Obsidian: Manage vaults → Open folder as vault → `~/Documents/Github/Thirty-One/docs`. Reinstall Copilot from Community plugins (it is listed in `community-plugins.json`) and re-enter its API key. Confirm `[[Design Plan]]`-style links resolve and the graph view matches. Then close the old vault.

### 8. Retire the old folder (Reed)

Only after step 7 checks out:

```bash
cd ~/Documents
diff -rq --exclude .DS_Store --exclude .copilot --exclude copilot --exclude .obsidian ThirtyOne Github/Thirty-One/docs
mv ThirtyOne ~/.Trash/ThirtyOne-vault-pre-migration
```

Expected `diff` output: only the four dropped Design files/folders listed as "Only in ThirtyOne/Design", plus `canvas` only in docs. Empty the Trash once the repo has been pulled on at least one other machine or you've confirmed it on GitHub.

## Verification

- `git ls-files docs | wc -l` is about 50 (22 notes + 27 canvas files + .obsidian json + this file).
- `git ls-files docs | grep -c '\.wav\|main\.js\|model-catalog'` is 0.
- GitHub renders `docs/Design/Design.md` and the canvas link opens.
- Obsidian opens `docs/` with no missing-link warnings.
- `pnpm check` still passes on `main`.

## After

Future design changes: edit on the canvas, re-pull `docs/Design/canvas/`, record the *why* in `docs/Design/Design.md`, commit together with the token change in `apps/mobile/src/theme/`. One PR, one history.
