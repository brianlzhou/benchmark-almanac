// Models answer Chinese financial qualification questions. The score is answer accuracy across the knowledge test.
// Score: knowledge answer accuracy (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/cflue.ts';
const board: Leaderboard = { benchmark: "cflue-knowledge", stats: {
  'Weighted-F1_2': { name: 'Weighted F1', unit: '%', better: 'higher' },
  'BLEU-1_3': { name: 'BLEU-1', unit: '%', better: 'higher' },
  'BLEU-4_4': { name: 'BLEU-4', unit: '%', better: 'higher' },
  'ROUGE-1_5': { name: 'ROUGE-1', unit: '%', better: 'higher' },
  'ROUGE-2_6': { name: 'ROUGE-2', unit: '%', better: 'higher' },
  'ROUGE-L_7': { name: 'ROUGE-L', unit: '%', better: 'higher' },
}, url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Knowledge accuracy$", "^Knowledge accuracy$") };
export default board;
