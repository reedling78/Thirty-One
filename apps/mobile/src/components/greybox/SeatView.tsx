import type { RoundResult, SeatView as SeatInfo } from '@thirtyone/rules';
import { PlayerRow } from './PlayerRow';

interface Props {
  seat: SeatInfo;
  /** Present while the round's hands are revealed on the table. */
  result: RoundResult | null;
  round: number;
  /** Position among the opponents, for the deal stagger. */
  order: number;
  /** Their last completed move this round, in words. */
  lastAction: string | null;
}

/** Every verdict the reveal can give, for a seat and for your own panel. */
const VERDICTS = {
  thirtyOne: { seat: '31!', you: '31!' },
  // The KNOCKED pill already marks the knocker, so the verdict doesn't repeat it.
  foldsTwo: { seat: 'lowest — folds two corners', you: 'lowest — you fold two corners' },
  out: { seat: 'lowest — out of the game', you: 'lowest — you are out of the game' },
  foldsOne: { seat: 'lowest — folds a corner', you: 'lowest — you fold a corner' },
  knockedSafe: { seat: 'knocked — safe', you: 'knocked — safe' },
  safe: { seat: 'safe', you: 'safe' },
} as const;

/** The longest verdict your panel can show, so the panel can reserve room for it. */
export const LONGEST_YOUR_VERDICT = Object.values(VERDICTS)
  .map((v) => v.you)
  .reduce((a, b) => (b.length > a.length ? b : a));

/** What the reveal says about one seat: 31, knocked and safe, lowest, or safe. */
export function revealTag(
  seat: SeatInfo,
  result: RoundResult,
  /** Phrase it for the player's own panel: "you fold a corner". */
  you = false,
): { tag: string; loser: boolean } {
  const corners = result.penalties.find((p) => p.seat === seat.index)?.corners ?? 0;
  const willBeOut = corners > 0 && seat.folds + corners > 4;
  const say = (v: { seat: string; you: string }) => (you ? v.you : v.seat);
  if (seat.revealed?.score.kind === 'thirtyOne')
    return { tag: say(VERDICTS.thirtyOne), loser: false };
  if (corners === 2) return { tag: say(VERDICTS.foldsTwo), loser: true };
  if (corners === 1) return { tag: say(willBeOut ? VERDICTS.out : VERDICTS.foldsOne), loser: true };
  if (seat.index === result.knocker) return { tag: say(VERDICTS.knockedSafe), loser: false };
  return { tag: say(VERDICTS.safe), loser: false };
}

/** An opponent on the table: face-down cards and corners during play; cards and score at the reveal. */
export function SeatView({ seat, result, round, order, lastAction }: Props) {
  if (result && seat.revealed) {
    const { tag, loser } = revealTag(seat, result);
    return (
      <PlayerRow
        name={seat.id}
        tag={tag}
        cards={seat.revealed.hand}
        figure={{ kind: 'score', total: seat.revealed.score.total }}
        emphasis={loser ? 'loser' : seat.index === result.knocker ? 'knocker' : 'none'}
        badge={seat.index === result.knocker ? 'KNOCKED' : undefined}
        dealer={seat.isDealer}
        dimmed={seat.out}
      />
    );
  }

  // "Playing now" gets its ▶ from the row, as a shape rather than a character.
  const tag = seat.out
    ? 'out of the game'
    : seat.isTurn
      ? 'Playing now'
      : (lastAction ?? 'waiting');
  return (
    <PlayerRow
      name={seat.id}
      tag={tag}
      cards={seat.cardCount}
      figure={{ kind: 'chip', folds: seat.folds, out: seat.out }}
      emphasis={seat.isTurn ? 'turn' : seat.isKnocker ? 'knocker' : 'none'}
      badge={seat.isKnocker ? 'KNOCKED' : undefined}
      dealer={seat.isDealer}
      dimmed={seat.out}
      dealKey={round}
      delay={400 + order * 180}
    />
  );
}
