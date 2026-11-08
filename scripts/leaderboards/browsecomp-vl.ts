// BrowseComp-VL: the paper's BC-VL Avg. column covers both difficulty levels.
// Direct inference and RAG are whole-benchmark configurations. Agent names remain harnesses.
// These are the paper's static results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2508.05748";
import { paperRows, paperTables, paperModel } from '../lib/boards/arxiv-h1.ts';
const board: Leaderboard = {
  benchmark: "browsecomp-vl",
  url: "https://raw.githubusercontent.com/Alibaba-NLP/DeepResearch/main/WebAgent/WebWatcher/README.md",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const t = (await paperTables(FEED))[7];
    if (!t?.[0]?.some(c => c.text === 'BC-VL')) throw new Error('BC-VL table changed');
    const rows: LeaderboardRow[] = []; let group = '';
    for (const r of t) {
      if (r.length === 1) { group = r[0].text; continue; }
      if (r.length !== 7 || num(r[3].text) === undefined) continue;
      let model = paperModel(r[0].text); let harness: string | undefined;
      if (model.startsWith('OmniSearch')) {model = 'GPT-4o (snapshot unspecified)'; harness = 'OmniSearch';}
      if (model.startsWith('WebWatcher')) {harness = 'WebWatcher';}
      rows.push({model, score: num(r[3].text)!, setting: group, ...(harness ? {harness} : {}), metrics: {level1: num(r[1].text)!, level2: num(r[2].text)!}});
    }
    if (rows.length !== 15) throw new Error('BC-VL expected 15 rows');
    return rows;
  },
};
export default board;
