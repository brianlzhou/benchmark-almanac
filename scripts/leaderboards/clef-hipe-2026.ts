// HIPE 2026 ranks historical newspaper systems by the mean Impresso profile score. Join the official TSV to the named HTML ranking by rank and run.
import type { Leaderboard } from "./types.ts";
import { fetchText } from "../lib/util.ts";
import { tables } from "../lib/html.ts";
const board: Leaderboard = {
  benchmark: "clef-hipe-2026",
  url: "https://hipe-eval.github.io/HIPE-2026/results",
  feed: "https://hipe-eval.github.io/HIPE-2026/assets/results/ternary/results.d/system-rankings/ranking-overall-test-a.tsv",
  terms: "The accuracy table contains submitted runs and baselines. I found no reuse terms for this TSV in the evaluation repository. https://github.com/hipe-eval/HIPE-2026-eval The HIPE results host returned 404 for robots.txt.",
  aliases: {'Ministral-3-3B-Instruct GGUF baseline 0.2.2 random seed 42':'ministral-3-3b-instruct'},
  async fetch() {
    const table = tables(await fetchText(this.url)).find(t => t[0]?.some(c => c.text === 'mean impresso profile score'));
    await new Promise(resolve => setTimeout(resolve,1050));
    const [head,...lines] = (await fetchText(this.feed)).trim().split(/\r?\n/);
    if (!table || !head.startsWith('rank\tteam\trun\tscore\t') || lines.length < 46 || lines.length !== table.length-1) throw new Error('Incomplete HIPE accuracy profile');
    return lines.map(line => {
      const [rank,,run,value] = line.split('\t');
      const row = table.find(r => r[0].text === rank && r[3].text === run);
      const score = Number(value);
      if (!row || !value || !Number.isFinite(score) || Math.abs(Number(row[4].text)-score) > 0.000051) throw new Error('HIPE TSV and page disagree');
      return { model:row[1].text, setting:run, submitter:row[2].text, score };
    });
  },
};
export default board;
