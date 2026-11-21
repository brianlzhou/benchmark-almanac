// Models complete Chinese financial language tasks. The score is the published average of the application task metrics.
// Score: published application Avg.. 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/cflue.ts';
const board: Leaderboard = { benchmark: "cflue-application", stats: { 'Avg._9': { name: 'Application average', unit: '%', better: 'higher' } }, parts: {
  'Fin_MT en2zh_2': { name: 'Machine translation English to Chinese', group: 'Task type', note: 'BLEU-4 component of the application average.' },
  '-_3': { name: 'Machine translation English to Chinese (COMET)', group: 'Task type', note: 'COMET component of the application average.' },
  'Fin_MT zh2en_4': { name: 'Machine translation Chinese to English', group: 'Task type', note: 'BLEU-4 component of the application average.' },
  '-_5': { name: 'Machine translation Chinese to English (COMET)', group: 'Task type', note: 'COMET component of the application average.' },
  Fin_RE_6: { name: 'Relation extraction', group: 'Task type', note: 'F1 component of the application average.' },
  Fin_RC_7: { name: 'Reading comprehension', group: 'Task type', note: 'ROUGE-L component of the application average.' },
  Fin_TG_8: { name: 'Text generation', group: 'Task type', note: 'ROUGE-L component of the application average.' },
}, url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Application", "^Application; Fin_TC accuracy$") };
export default board;
