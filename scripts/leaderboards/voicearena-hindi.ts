import { voiceArena } from '../lib/boards/voicearena.ts';
const board = voiceArena("Hindi","hindi");
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(row => {
  const ci = row.metrics?.ci;
  return {...row, ...(typeof ci === 'number' && ci >= 0 ? {low: row.score - ci, high: row.score + ci} : {})};
});
export default board;
