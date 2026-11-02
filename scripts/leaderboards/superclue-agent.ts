// SuperCLUE-Agent (CLUE team) on superclueai.com. The specific-board page loads /data/agent_list/Agent/<round>.xlsx;
// the rounds come from the folder-to-rounds map in the app's visualization-utils chunk (Agent:["2024年10月",...],
// newest first). The score is 总分 (total score) on the Agent总榜 sheet of the newest round; 发布日期 is passed as
// the run date. The XLSX reader is shared with superclue.ts.
import type { Leaderboard } from './types.ts';
import { SC_ALIASES, SC_SITE, SC_TERMS, scChunk, scRows } from './superclue.ts';

/** Newest round of a specific board folder, from the app's folder map. */
export async function scRound(folder: string): Promise<string> {
  const js = await scChunk('visualization-utils-');
  const m = js.match(new RegExp(`[,{]"?${folder}"?:\\["([^"]+)"`));
  if (!m) throw new Error(`no rounds for ${folder}`);
  return m[1];
}

const board: Leaderboard = {
  benchmark: 'superclue-agent',
  url: `${SC_SITE}/specificpage`,
  feed: `${SC_SITE}/data/agent_list/Agent/<round>.xlsx (Agent总榜 sheet, 总分)`,
  terms: SC_TERMS,
  aliases: SC_ALIASES,
  fetch: async () => scRows(`/data/agent_list/Agent/${await scRound('Agent')}.xlsx`, 'Agent总榜', '模型'),
};
export default board;
