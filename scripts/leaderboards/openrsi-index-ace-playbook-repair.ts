// Agents repair a reasoning playbook under a fixed budget. The score is held-out Formula exact-answer accuracy as a fraction.
// Score: held-out Formula accuracy fraction. 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/openrsi-index.ts';
const board: Leaderboard = { benchmark: "openrsi-index-ace-playbook-repair", url: "https://index.openrsi.foundation/tasks/ace-playbook-repair.html", feed: "https://index.openrsi.foundation/tasks/ace-playbook-repair.html", terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 chart: {...sourceBoard.chart!, y: {...sourceBoard.chart!.y, unit: "score"}},
 fetch: () => trackRows("^ACE\\ Playbook\\ Inspection\\ and\\ Repair;", "^ACE\\ Playbook\\ Inspection\\ and\\ Repair;\\s*") };
export default board;
