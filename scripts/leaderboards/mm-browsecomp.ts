// MM-BrowseComp: the main table's Overall OA is outcome accuracy over all 400 questions, in percent.
//  Strict accuracy and checklist scores remain metrics. Tool use and reasoning effort are whole-benchmark settings.
//  Named agent frameworks become harnesses. These are static paper results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2508.13186";
import { paperRows, paperTables, paperModel } from '../lib/boards/arxiv-h1.ts';
const board: Leaderboard = {
  benchmark: "mm-browsecomp",
  url: "https://github.com/MMBrowseComp/MM-BrowseComp",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const t = (await paperTables(FEED))[1];
    if (!t?.[0]?.some(c => c.text === 'Overall')) throw new Error('MM-BrowseComp main table changed');
    let mode = '', harness: string | undefined;
    const out: LeaderboardRow[] = [];
    for (const r of t) {
      const label = r[0]?.text ?? '';
      if (/^Tool-Free/.test(label)) {mode = 'tools off'; harness = undefined;}
      if (/^Tool-Augmented/.test(label)) {mode = 'tools on'; harness = undefined;}
      if (/^(Agent-R1|OWL|DeerFlow|WebDancer)$/.test(label)) {harness = label; mode = 'tools on';}
      if (r.length !== 14 || num(r[1]?.text) === undefined) continue;
      const high = /-high$/i.test(label);
      const model = paperModel(label.replace(/-high$/i, ''));
      out.push({model, score: num(r[1].text)!, setting: [mode, high ? 'high effort' : ''].filter(Boolean).join('; '), ...(harness ? {harness} : {}), metrics: {strictAccuracy: num(r[2].text)!, checklistScore: num(r[3].text)!}});
    }
    if (out.length !== 36) throw new Error(`MM-BrowseComp expected 36 rows, found ${out.length}`);
    return out;
  },
};
export default board;
