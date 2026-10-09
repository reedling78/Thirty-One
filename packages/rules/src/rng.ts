/**
 * Deterministic randomness. The engine never calls Math.random; every shuffle
 * takes an RngState and returns the next one, so a game is fully reproducible
 * from its seed and can be replayed from a bug report.
 *
 * The generator is SplitMix32 — small, fast, and good enough for shuffling cards.
 * State is a single uint32 so it serialises as a plain number.
 */

export type RngState = number;

/** Normalise any integer seed to a uint32 state. */
export function seedRng(seed: number): RngState {
  return seed >>> 0 || 0x9e3779b9;
}

export interface RngStep {
  /** Uniform in [0, 1). */
  readonly value: number;
  readonly state: RngState;
}

/** Advance the generator once. */
export function nextRandom(state: RngState): RngStep {
  const s = (state + 0x9e3779b9) >>> 0;
  let z = s;
  z = Math.imul(z ^ (z >>> 16), 0x21f0aaad) >>> 0;
  z = Math.imul(z ^ (z >>> 15), 0x735a2d97) >>> 0;
  z = (z ^ (z >>> 15)) >>> 0;
  return { value: z / 0x100000000, state: s };
}

/** Uniform integer in [0, maxExclusive). */
export function nextInt(state: RngState, maxExclusive: number): { value: number; state: RngState } {
  const step = nextRandom(state);
  return { value: Math.floor(step.value * maxExclusive), state: step.state };
}

/** Fisher–Yates. Returns a new array; the input is not mutated. */
export function shuffle<T>(items: readonly T[], state: RngState): { items: T[]; state: RngState } {
  const out = items.slice();
  let s = state;
  for (let i = out.length - 1; i > 0; i--) {
    const step = nextInt(s, i + 1);
    s = step.state;
    const j = step.value;
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return { items: out, state: s };
}
