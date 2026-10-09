import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * Developer-only knobs. Practice is a fixed four-seat table for players; the
 * seat override exists so the ten-seat layout can be tested on a real phone.
 * Nothing here persists — that is Milestone 6's job for real settings.
 */
export const PRACTICE_SEATS = 4;

interface DevSettings {
  readonly seats: number;
  setSeats(n: number): void;
}

const Ctx = createContext<DevSettings>({ seats: PRACTICE_SEATS, setSeats: () => {} });

export function DevSettingsProvider({ children }: { children: ReactNode }) {
  const [seats, setSeats] = useState(PRACTICE_SEATS);
  const value = useMemo<DevSettings>(
    () => ({ seats, setSeats: (n) => setSeats(Math.min(10, Math.max(2, n))) }),
    [seats],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDevSettings(): DevSettings {
  return useContext(Ctx);
}
