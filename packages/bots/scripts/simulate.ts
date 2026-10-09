/**
 * Bot-vs-bot simulation. Usage:
 *   pnpm -F @thirtyone/bots simulate [games=2000] [seed=1]
 * Reports per table size, so the seat-cap question has deck-side evidence.
 */
import { simulate } from '../src/simulate';
import { easyBot, normalBot } from '../src/strategy';

const games = Number(process.argv[2] ?? 2000);
const seed = Number(process.argv[3] ?? 1);

const pad = (v: number | string, w = 8) => String(v).padStart(w);
const f = (n: number, d = 2) => n.toFixed(d);

console.log(`normal vs normal — ${games} games per table size, seed ${seed}\n`);
console.log(
  ['seats', 'rounds/g', 'turns/r', 'knock/r', 'knockWin', '31s/r', 'reshuf/r', 'replay/g']
    .map((h) => pad(h))
    .join(''),
);
for (const seats of [2, 4, 6, 8, 10]) {
  const s = simulate({ games, seats, bots: [normalBot], seed });
  console.log(
    [
      seats,
      f(s.roundsPerGame, 1),
      f(s.turnsPerRound, 1),
      f(s.knocksPerRound),
      f(s.knockSuccessRate),
      f(s.thirtyOnesPerRound, 3),
      f(s.reshufflesPerRound),
      f(s.replaysPerGame, 3),
    ]
      .map((v) => pad(v))
      .join(''),
  );
}

console.log('\neasy vs normal at four seats (easy in seats 0 and 2):');
const mixed = simulate({ games, seats: 4, bots: [easyBot, normalBot], seed });
console.log(`  win share by bot: ${JSON.stringify(mixed.winShareByBot)}`);
console.log(`  win share by seat: ${mixed.winShare.map((w) => f(w)).join(' ')}`);
