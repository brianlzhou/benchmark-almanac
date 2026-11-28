// HIPE 2026 ranks historical newspaper systems by the mean Impresso profile score. Join the official TSV to the named HTML ranking by rank and run.
// The Random Decision Baseline decides at random, so it is not a model and the board leaves it out.
import type { Leaderboard } from "./types.ts";
import { fetchText } from "../lib/util.ts";
import { tables } from "../lib/html.ts";
const board: Leaderboard = {
  benchmark: "clef-hipe-2026",
  notModels: /^Random Decision Baseline$/,
  url: "https://hipe-eval.github.io/HIPE-2026/results",
  feed: "https://hipe-eval.github.io/HIPE-2026/assets/results/ternary/results.d/system-rankings/ranking-overall-test-a.tsv",
  terms: "The accuracy table contains submitted runs and baselines. I found no reuse terms for this TSV in the evaluation repository. https://github.com/hipe-eval/HIPE-2026-eval The HIPE results host returned 404 for robots.txt.",
  stats: {
    surpriseScore: { name: 'Surprise profile score', unit: 'score', better: 'higher' },
    modelSizeGb: { name: 'Model size', unit: 'gb', better: 'lower' },
  },
  aliases: {'Ministral-3-3B-Instruct GGUF baseline 0.2.2 random seed 42':'ministral-3-3b-instruct'},
  async fetch() {
    const allTables = tables(await fetchText(this.url));
    const table = allTables.find(t => t[0]?.some(c => c.text === 'mean impresso profile score'));
    const surpriseTable = allTables.find(t => t[0]?.some(c => c.text === 'surprise profile score'));
    const effTable = allTables.find(t => t[0]?.some(c => c.text === 'mean efficiency profile rank'));
    const surpriseByKey = new Map<string, number>();
    for (const r of surpriseTable?.slice(1) ?? []) {
      const v = Number(r[4]?.text);
      if (r[1]?.text && r[3]?.text && Number.isFinite(v)) surpriseByKey.set(`${r[1].text}\0${r[3].text}`, v);
    }
    const effByKey = new Map<string, { params?: number; modelSizeGb?: number }>();
    for (const r of effTable?.slice(1) ?? []) {
      const key = `${r[1]?.text ?? ''}\0${r[2]?.text ?? ''}`;
      const rawParams = Number((r[5]?.text ?? '').replace(/,/g, ''));
      const sizeMatch = (r[6]?.text ?? '').match(/([\d.]+)\s*(MB|GB)/i);
      const rawSize = sizeMatch ? Number(sizeMatch[1]) * (sizeMatch[2].toUpperCase() === 'MB' ? 1 / 1000 : 1) : NaN;
      effByKey.set(key, {
        ...(Number.isFinite(rawParams) && rawParams > 0 ? { params: Number((rawParams / 1e9).toFixed(4)) } : {}),
        ...(Number.isFinite(rawSize) && rawSize > 0 ? { modelSizeGb: Number(rawSize.toFixed(3)) } : {}),
      });
    }
    await new Promise(resolve => setTimeout(resolve,1050));
    const [head,...lines] = (await fetchText(this.feed)).trim().split(/\r?\n/);
    if (!table || !head.startsWith('rank\tteam\trun\tscore\t') || lines.length < 46 || lines.length !== table.length-1) throw new Error('Incomplete HIPE accuracy profile');
    return lines.map(line => {
      const [rank,,run,value] = line.split('\t');
      const row = table.find(r => r[0].text === rank && r[3].text === run);
      const score = Number(value);
      if (!row || !value || !Number.isFinite(score) || Math.abs(Number(row[4].text)-score) > 0.000051) throw new Error('HIPE TSV and page disagree');
      const key = `${row[1].text}\0${run}`;
      const metrics: Record<string, number> = {};
      const surp = surpriseByKey.get(key);
      if (surp !== undefined) metrics.surpriseScore = surp;
      const eff = effByKey.get(key);
      if (eff?.modelSizeGb !== undefined) metrics.modelSizeGb = eff.modelSizeGb;
      return {
        model: row[1].text,
        setting: run,
        submitter: row[2].text,
        score,
        ...(eff?.params !== undefined ? { params: eff.params } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      };
    });
  },
};
export default board;
