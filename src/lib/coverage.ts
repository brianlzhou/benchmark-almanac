// Which strong models a leaderboard is missing. A board whose newest score is months old still names a
// leader, but only among the models someone tested. The pages say so.
import { benchSummary, eciOrder, modelById, AS_OF } from './data.ts';

export interface Untested {
  /** Release date of the newest model on the board. */
  last: string;
  /** Of the strongest models on the capability index, those without a score on this board. */
  missing: string[];
  /** The missing models released after the newest tested one. */
  newer: string[];
  /** Missing models whose lab reports a score of its own in a card. */
  claimed: string[];
  top: number;
}

export function untested(id: string, top = 20): Untested | null {
  const s = benchSummary(id);
  if (s.board.length < 3) return null;
  const onBoard = new Set(s.board.map((x) => x.model));
  const claims = new Set(s.cardBoard.map((x) => x.model));
  const last = s.board.map((x) => modelById.get(x.model)?.released ?? x.date ?? '').sort().at(-1) ?? '';
  const missing = eciOrder.slice(0, top).filter((m) => !onBoard.has(m));
  const newer = missing.filter((m) => (modelById.get(m)?.released ?? '') > last);
  // a board updated in the last six weeks is current enough: models released since may simply be queued
  const stale = (Date.parse(AS_OF) - Date.parse(last)) / 86_400_000 > 45;
  if (newer.length < 2 || !stale) return null;
  return { last, missing, newer, claimed: s.boardSource === 'epoch' ? missing.filter((m) => claims.has(m)) : [], top };
}
