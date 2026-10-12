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

/** What the reveal says about one seat: 31, knocked and safe, lowest, or safe. */
export function revealTag(seat: SeatInfo, result: RoundResult): { tag: string; loser: boolean } {
  const corners = result.penalties.find((p) => p.seat === seat.index)?.corners ?? 0;
  const willBeOut = corners > 0 && seat.folds + corners > 4;
  if (seat.revealed?.score.kind === 'thirtyOne') return { tag: '31!', loser: false };
  if (corners === 2) return { tag: 'knocked and lowest — folds two corners', loser: true };
  if (corners === 1)
    return { tag: willBeOut ? 'lowest — out of the game' : 'lowest — folds a corner', loser: true };
  if (seat.index === result.knocker) return { tag: 'knocked — safe', loser: false };
  return { tag: 'safe', loser: false };
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

  const tag = seat.out ? 'out' : seat.isTurn ? '▶ Playing now' : (lastAction ?? 'waiting');
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
