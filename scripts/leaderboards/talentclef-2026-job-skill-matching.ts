// TalentCLEF ranks submitted job-skill matching systems by graded NDCG. Its TSV lists each run and the binary and graded retrieval measures.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://talentclef.github.io/talentclef/results_task_b_2026/results_b.tsv";
const board: Leaderboard = {
  benchmark: "talentclef-2026-job-skill-matching",
  url: "https://talentclef.github.io/talentclef/docs/talentclef-2026/results/task_b_results/",
  feed,
  terms: "The organizers license the results pages under CC BY 4.0. The host returns 404 for robots.txt.",
  parts: {"MAP_binary":"MAP binary","MAP_graded":"MAP graded","MRR_binary":"MRR binary","MRR_graded":"MRR graded","NDCG_binary":"NDCG binary","PAt5_binary":"P@5 binary","PAt5_graded":"P@5 graded","PAt10_binary":"P@10 binary","PAt10_graded":"P@10 graded","PAt100_binary":"P@100 binary","PAt100_graded":"P@100 graded"},
  harnesses: 'system',
  async fetch() {
    const source = await fetchText(feed);
    const headers = ["Team","run_ID","Models","NDCG_graded","MAP_binary","MAP_graded","MRR_binary","MRR_graded","NDCG_binary","P@5_binary","P@5_graded","P@10_binary","P@10_graded","P@100_binary","P@100_graded"];
    const table = [source.trim().split(/\r?\n/).map(l => l.split('\t').map(c => c.trim()))].find(t => headers.every(h => t[0]?.includes(h)));
    if (!table) throw new Error('Missing results table');
    const records = table.slice(1).map(c => Object.fromEntries(table[0].map((h, i) => [h, c[i]])));
    const numeric = (s: string) => {
      const value = s?.replace(/%$/, '').trim();
      if (!value || !Number.isFinite(Number(value))) throw new Error('Invalid result: ' + s);
      return Number(value);
    };
    const rows = records.map(r => {
      const model = r["Team"];
      if (!model) throw new Error('Missing model name');
      return { model, score: numeric(r["NDCG_graded"]),
        metrics: { MAP_binary: numeric(r["MAP_binary"]), MAP_graded: numeric(r["MAP_graded"]), MRR_binary: numeric(r["MRR_binary"]), MRR_graded: numeric(r["MRR_graded"]), NDCG_binary: numeric(r["NDCG_binary"]), PAt5_binary: numeric(r["P@5_binary"]), PAt5_graded: numeric(r["P@5_graded"]), PAt10_binary: numeric(r["P@10_binary"]), PAt10_graded: numeric(r["P@10_graded"]), PAt100_binary: numeric(r["P@100_binary"]), PAt100_graded: numeric(r["P@100_graded"]) }, submitter:r.Team, harness:r.Team, setting:[r.run_ID,r.Pipeline,r['LLM strategy']].filter(Boolean).join(', '),
        models:r.Models ? r.Models.split(/;\s*/).filter(Boolean) : undefined };
    });
    if (rows.length < 19) throw new Error('Incomplete results');
    return rows;
  },
};
export default board;
