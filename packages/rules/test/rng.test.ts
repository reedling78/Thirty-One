import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { cardId, makeDeck, nextInt, nextRandom, seedRng, shuffle } from '../src/index';

describe('rng', () => {
  it('is deterministic for a seed', () => {
    const a = nextRandom(seedRng(42));
    const b = nextRandom(seedRng(42));
    expect(a).toEqual(b);
    expect(nextRandom(a.state).value).not.toBe(a.value);
  });

  it('stays in [0, 1) and nextInt stays in range', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer({ min: 1, max: 1000 }), (seed, max) => {
        let s = seedRng(seed);
        for (let i = 0; i < 20; i++) {
          const r = nextRandom(s);
          expect(r.value).toBeGreaterThanOrEqual(0);
          expect(r.value).toBeLessThan(1);
          const n = nextInt(s, max);
          expect(n.value).toBeGreaterThanOrEqual(0);
          expect(n.value).toBeLessThan(max);
          s = r.state;
        }
      }),
    );
  });

  it('seed 0 does not get stuck', () => {
    const s0 = seedRng(0);
    const vals = new Set<number>();
    let s = s0;
    for (let i = 0; i < 10; i++) {
      const r = nextRandom(s);
      vals.add(r.value);
      s = r.state;
    }
    expect(vals.size).toBe(10);
  });
});

describe('shuffle', () => {
  it('is a permutation that conserves all 52 cards and does not mutate its input', () => {
    fc.assert(
      fc.property(fc.integer(), (seed) => {
        const deck = makeDeck();
        const before = deck.map(cardId);
        const { items } = shuffle(deck, seedRng(seed));
        expect(deck.map(cardId)).toEqual(before);
        expect(items).toHaveLength(52);
        expect([...items.map(cardId)].sort()).toEqual([...before].sort());
      }),
    );
  });

  it('is reproducible from the seed and different across seeds', () => {
    const deck = makeDeck();
    const a = shuffle(deck, seedRng(7)).items.map(cardId);
    const b = shuffle(deck, seedRng(7)).items.map(cardId);
    const c = shuffle(deck, seedRng(8)).items.map(cardId);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
    expect(a).not.toEqual(deck.map(cardId));
  });
});
