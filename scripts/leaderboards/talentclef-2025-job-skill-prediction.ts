// TalentCLEF ranks English job-to-skill retrieval runs by mean average precision. Its TSV lists the submitted model, training method and two additional ranking measures.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://talentclef.github.io/talentclef/results_task_b/results_b.tsv";
const board: Leaderboard = {
  benchmark: "talentclef-2025-job-skill-prediction",
  url: "https://talentclef.github.io/talentclef/docs/talentclef-2025/results/task_b_results/",
  feed,
  terms: "The organizers license the results pages under CC BY 4.0. The host returns 404 for robots.txt.",
  parts: {"mrr":"MRR","ndcg":"NDCG"},
  harnesses: 'system',
  async fetch() {
    const source = await fetchText(feed);
    const headers = ["Team","run_ID","Base model","Method","Type","Loss","Model size","MAP","MRR","NDCG"];
    const table = [source.trim().split(/\r?\n/).map(l => l.split('\t').map(c => c.trim()))].find(t => headers.every(h => t[0]?.includes(h)));
    if (!table) throw new Error('Missing results table');
    const records = table.slice(1).map(c => Object.fromEntries(table[0].map((h, i) => [h, c[i]])));
    const numeric = (s: string) => {
      const value = s?.replace(/%$/, '').trim();
      if (!value || !Number.isFinite(Number(value))) throw new Error('Invalid result: ' + s);
      return Number(value);
    };
    const rows = records.map(r => {
      const model = r["Base model"];
      if (!model) throw new Error('Missing model name');
      return { model, score: numeric(r["MAP"]),
        metrics: { mrr: numeric(r["MRR"]), ndcg: numeric(r["NDCG"]) }, submitter:r.Team, harness:r.Team,
        setting:[r.run_ID,r.Method,r.Type,r.Loss,r['LLM usage'],r['External data']].filter(v => v && v !== 'n/a').join(', '),
        params:/^[\d.]+[MB]$/.test(r['Model size']) ? parseFloat(r['Model size']) / (r['Model size'].endsWith('M') ? 1000 : 1) : undefined };
    });
    if (rows.length < 17) throw new Error('Incomplete results');
    return rows;
  },
};
export default board;
