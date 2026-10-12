import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useSettings } from '@/settings/Settings';
import { layout } from '@/theme/tokens';
import type { TableSnapshot } from './TableClient';

export type CalloutKind = 'knocked' | 'folds' | 'doubleFolds';

export interface Callout {
  readonly kind: CalloutKind;
  /** Changes on every trigger, so a repeat restarts the stamp. */
  readonly id: number;
}

export const CALLOUT_TEXT: Record<CalloutKind, string> = {
  knocked: 'KNOCKED!',
  folds: 'FOLDS!',
  doubleFolds: 'DOUBLE FOLDS!',
};

/** What a screen reader hears: the stamp's meaning, not its capitals. */
function announcement(kind: CalloutKind, name: string): string {
  if (kind === 'knocked') return `${name} knocked!`;
  if (kind === 'folds') return `${name} folds a corner!`;
  return `${name} folds two corners!`;
}

/**
 * Stamps over an opponent's row when they knock, fold or double-fold: held for
 * 3 s, then faded over 0.6 s (just held, with reduce motion on). Folds stamp at
 * the reveal, when the penalties are known and the row wears its loser fill.
 * Each one is announced as a status to screen readers.
 */
export function useRowCallouts(snapshot: TableSnapshot | null): Readonly<Record<number, Callout>> {
  const { motionReduced } = useSettings();
  const [callouts, setCallouts] = useState<Readonly<Record<number, Callout>>>({});
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const nextId = useRef(1);

  useEffect(() => {
    if (!snapshot || snapshot.events.length === 0) return;
    const { view } = snapshot;
    const fired: { seat: number; kind: CalloutKind }[] = [];
    for (const e of snapshot.events) {
      if (e.type === 'knocked') fired.push({ seat: e.seat, kind: 'knocked' });
      if (e.type === 'roundOver')
        for (const p of e.penalties)
          fired.push({ seat: p.seat, kind: p.corners >= 2 ? 'doubleFolds' : 'folds' });
    }
    // Only opponents' rows are stamped; your own panel is left as drawn.
    const theirs = fired.filter((f) => f.seat !== view.seat);
    if (theirs.length === 0) return;

    const life = layout.calloutHoldMs + (motionReduced ? 0 : layout.calloutFadeMs);
    setCallouts((prev) => {
      const next = { ...prev };
      for (const f of theirs) next[f.seat] = { kind: f.kind, id: nextId.current++ };
      return next;
    });
    for (const f of theirs) {
      const name = view.seats[f.seat]?.id ?? `Seat ${f.seat}`;
      AccessibilityInfo.announceForAccessibility(announcement(f.kind, name));
      clearTimeout(timers.current.get(f.seat));
      timers.current.set(
        f.seat,
        setTimeout(() => {
          timers.current.delete(f.seat);
          setCallouts((prev) => {
            const { [f.seat]: _gone, ...rest } = prev;
            return rest;
          });
        }, life),
      );
    }
    // Only react to new snapshots.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot]);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  return callouts;
}
