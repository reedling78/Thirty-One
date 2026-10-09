import { cardLabel, type GameEvent, type PlayerView } from '@thirtyone/rules';
import { useEffect, useState } from 'react';
import type { TableClient, TableSnapshot } from './TableClient';

/** Subscribe a screen to a table. Keeps the last few events for a simple log. */
export function useTable(client: TableClient, logLength = 4) {
  const [snapshot, setSnapshot] = useState<TableSnapshot | null>(null);
  const [log, setLog] = useState<readonly string[]>([]);
  /** Seats that have gone out, in order — for the results screen. */
  const [eliminated, setEliminated] = useState<readonly number[]>([]);

  useEffect(() => {
    const unsubscribe = client.subscribe((s) => {
      setSnapshot(s);
      if (s.events.length) {
        setLog((prev) =>
          [...prev, ...s.events.map((e) => describeEvent(e, s.view.seat, s.view))].slice(
            -logLength,
          ),
        );
        const outs = s.events
          .filter((e) => e.type === 'eliminated' || e.type === 'forfeited')
          .map((e) => e.seat);
        if (outs.length) setEliminated((prev) => [...prev, ...outs]);
      }
    });
    client.start();
    return () => {
      unsubscribe();
      client.dispose();
    };
  }, [client, logLength]);

  return { snapshot, log, eliminated };
}

function who(seat: number, view: PlayerView): string {
  return seat === view.seat ? 'You' : (view.seats[seat]?.id ?? `Seat ${seat}`);
}

export function describeEvent(e: GameEvent, me: number, view: PlayerView): string {
  switch (e.type) {
    case 'roundStarted':
      return `Round ${e.round}. ${who(e.dealer, view)} deals; ${cardLabel(e.discardTop)} is up.`;
    case 'turnChanged':
      return e.seat === me ? 'Your turn.' : `${who(e.seat, view)} to play.`;
    case 'drew':
      return e.source === 'discard'
        ? `${who(e.seat, view)} took the ${e.card ? cardLabel(e.card) : 'discard'}.`
        : `${who(e.seat, view)} drew from the deck.`;
    case 'reshuffled':
      return `Draw pile empty — reshuffled ${e.cards} cards.`;
    case 'discarded':
      return `${who(e.seat, view)} discarded ${cardLabel(e.card)}.`;
    case 'knocked':
      return `${who(e.seat, view)} knocked! Everyone else gets one more turn.`;
    case 'thirtyOne':
      return `${who(e.seat, view)} has 31!`;
    case 'roundOver':
      return e.reason === 'thirtyOne' ? 'Round over — 31.' : 'Round over — hands revealed.';
    case 'folded':
      return `${who(e.seat, view)} folds ${e.corners === 2 ? 'two corners' : 'a corner'}${e.onBus ? ' — on the bus' : ''}.`;
    case 'eliminated':
      return `${who(e.seat, view)} is out.`;
    case 'roundReplayed':
      return 'Everyone would be out — round replayed.';
    case 'dealerMoved':
      return '';
    case 'forfeited':
      return `${who(e.seat, view)} left the table.`;
    case 'gameWon':
      return e.seat === me ? 'You win the pot!' : `${who(e.seat, view)} wins the pot.`;
    case 'gameAbandoned':
      return 'The table emptied out. No winner.';
  }
}
