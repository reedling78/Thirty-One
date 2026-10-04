# ThirtyOne

A mobile card game based on Thirty-One: build the best three-card hand, knock when you're
confident, fold a corner when you lose, and don't end up on the bus.

## Layout

pnpm workspaces, one repo.

| Path                | What it is                                                                             |
| ------------------- | -------------------------------------------------------------------------------------- |
| `apps/mobile`       | Expo app (Expo Router, TypeScript strict)                                              |
| `packages/rules`    | `@thirtyone/rules` — the game engine. Pure functions, zero dependencies, no transport. |
| `packages/bots`     | `@thirtyone/bots` — computer opponents. Consume player views only.                     |
| `packages/tsconfig` | Shared TypeScript bases                                                                |

The rules engine is the one piece shared between the on-device practice game and the future
authoritative server, so it imports nothing outside itself. `pnpm purity` enforces that in CI.

## Getting started

```bash
corepack enable          # gives you the pinned pnpm
pnpm install
pnpm check               # typecheck, lint, test, purity, format
pnpm -F mobile start     # Expo dev server
```

## Design docs

Rules, features, stack decisions and plans live in the Obsidian vault, not in this repo.
