// ToolComp: Scale runs two boards, Agentic Tool Use (Enterprise) and Agentic Tool Use (Chat). This importer reads
// the Enterprise board, which the benchmark's record links. The score is final-answer accuracy in percent, graded
// by an LLM against the ground truth.
import type { Leaderboard } from './types.ts';
import { SCALE_TERMS, fetchScaleEntries, scaleFeed, scaleRows, scaleUrl } from '../lib/scale.ts';

const PAGE = scaleUrl('tool_use_enterprise');

const board: Leaderboard = {
  benchmark: 'toolcomp',
  url: PAGE,
  feed: scaleFeed(PAGE),
  terms: SCALE_TERMS,
  aliases: {},
  fetch: async () => scaleRows(await fetchScaleEntries(PAGE)),
};
export default board;
