// Prints the boards whose last read failed today, comma-separated, for a second try later in the same sync run.
// Many failures are a busy server or a timeout that clears within minutes (8 of 26 on 2026-11-17).
// usage: node scripts/failed-boards.ts
import { dataPath, readJson, today } from './lib/util.ts';

const lb = readJson<{ boards: Record<string, { failed?: { date: string } }> }>(dataPath('scores', 'leaderboards.json'));
console.log(Object.entries(lb.boards)
  .filter(([, b]) => b.failed?.date === today())
  .map(([id]) => id)
  .join(','));
