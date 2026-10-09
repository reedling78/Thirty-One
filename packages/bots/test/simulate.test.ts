import { describe, expect, it } from 'vitest';
import { easyBot, normalBot, playGame, simulate } from '../src/index';

describe('playGame', () => {
  it('plays to a single winner and is reproducible from the seed', () => {
    const a = playGame(4, [normalBot], 42);
    const b = playGame(4, [normalBot], 42);
    expect(a.state.phase).toBe('gameOver');
    expect(a.state.winner).not.toBeNull();
    expect(a.state.winner).toBe(b.state.winner);
    expect(a.events.length).toBe(b.events.length);
    expect(playGame(4, [normalBot], 43).events.length).not.toBe(a.events.length);
  });
});

describe('simulate', () => {
  it('reports sane aggregate statistics', () => {
    const s = simulate({ games: 40, seats: 4, bots: [normalBot, easyBot], seed: 1 });
    expect(s.games).toBe(40);
    expect(s.roundsPerGame).toBeGreaterThan(1);
    expect(s.turnsPerRound).toBeGreaterThan(1);
    expect(s.knocksPerRound).toBeGreaterThan(0);
    expect(s.knocksPerRound).toBeLessThanOrEqual(1);
    expect(s.knockSuccessRate).toBeGreaterThan(0);
    expect(s.knockSuccessRate).toBeLessThanOrEqual(1);
    expect(s.reshufflesPerRound).toBeGreaterThanOrEqual(0);
    expect(s.winShare.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
    expect(Object.values(s.winShareByBot).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
    expect(Object.keys(s.winShareByBot).sort()).toEqual(['easy', 'normal']);
  });

  it('the normal bot beats the easy bot more often than not', () => {
    const s = simulate({ games: 150, seats: 4, bots: [easyBot, normalBot], seed: 9 });
    expect(s.winShareByBot['normal']!).toBeGreaterThan(s.winShareByBot['easy']!);
  });
});
