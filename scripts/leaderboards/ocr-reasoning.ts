// OCR-Reasoning: Table 1 Overall is accuracy on the full 1,069-question benchmark, in percent.
//  The OCR + LLM group uses OCR as a harness. Table 2's non-CoT runs are additional whole-benchmark settings.
//  Reasoning-type scores remain metrics. These are static paper results and will not refresh with new model releases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2505.17163";
import { paperRows, paperTables, paperModel } from '../lib/boards/arxiv-h1.ts';
const board: Leaderboard = {
  benchmark: "ocr-reasoning",
  url: "https://github.com/SCUT-DLVCLab/OCR-Reasoning",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    const ts = await paperTables(FEED);
    const t = ts.find(t => t[0]?.[1]?.text === 'Overall' && t[0].length === 8);
    if (!t) throw new Error('OCR-Reasoning main results table missing');
    let harness: string | undefined;
    const clean = (s: string) => paperModel(s.replace(/\s+\([^)]*(?:20\d\d)[^)]*\)/g, '').replace(/\s+\w+ et al\. \(20\d\d\w?\)/g, '').replace(/^OpenAI-/, ''));
    const out: LeaderboardRow[] = [];
    for (const r of t) {
      if (r.length === 1) harness = r[0].text === 'OCR + LLM' ? 'OCR + LLM' : undefined;
      if (r.length !== 8 || num(r[1]?.text) === undefined) continue;
      const metrics: Record<string,number> = {};
      ['spatial','numerical','mathematical','enumerative','logical','multidisciplinary'].forEach((k,i)=>{metrics[k]=num(r[i+2].text)!;});
      out.push({model: clean(r[0].text), score: num(r[1].text)!, setting: 'CoT', ...(harness ? {harness} : {}), metrics});
    }
    const ablation = ts.find(t => t[0]?.[1]?.text === 'CoT');
    if (ablation) for (const r of ablation.slice(1)) {
      if (r.length !== 9 || !r[1].text.includes('times')) continue;
      out.push({model: clean(r[0].text),score:num(r[2].text)!,setting:'no CoT'});
    }
    if (out.length !== 36) throw new Error(`OCR-Reasoning expected 36 rows, found ${out.length}`);
    return out;
  },
};
export default board;
