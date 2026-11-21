// TB-MathModel ranks agents by O-Eval across 18 modeling problems. The authors publish multimodal
// and text-only runs in HTML tables, with robust and feasibility-adjusted scores alongside the headline.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text, num } from '../lib/html.ts';

const feed = 'https://wxj630.github.io/terminal-bench-math-modeling/';
const board: Leaderboard = {
  benchmark: 'tb-mathmodel', url: feed, feed, costPer: 'run',
  terms: 'The benchmark authors publish their scores and costs on the project page.',
  async fetch() {
    const all = tables(await fetchText(feed));
    const rows: LeaderboardRow[] = [];
    for (const mode of ['Multimodal','Text-only']) {
      const usd = mode === 'Multimodal';
      const main = all.find(t => t[0]?.[2]?.text === 'O-Eval' && t[0].some(c => c.text === 'Cost USD') === usd);
      const gated = all.find(t => t[0]?.some(c => c.text === 'Hard-gated O-Eval') && t[0].some(c => c.text === 'Cost USD') === usd);
      if (!main || !gated || main.length < (usd ? 4 : 12)) throw new Error('Missing TB-MathModel tables');
      const label = (html: string) => text(html.match(/<b>([\s\S]*?)<\/b>/)?.[1] ?? '');
      for (const r of main.slice(1)) {
        const name = label(r[0].html);
        const [harness, raw] = name.includes(' + ') ? name.split(' + ') : [undefined,name];
        const effort = raw.match(/\s+(?:\((max)\)|(xhigh|high|thinking))$/);
        const model = effort ? raw.slice(0,effort.index) : raw;
        const score = num(r[2].text), robust = num(r[3].text);
        if (!model || score === undefined || robust === undefined) throw new Error('Missing TB-MathModel score');
        const metrics: Record<string,number> = { robust, artifacts: Number(r[1].attrs['data-sort']), costRMB: Number(r[usd ? 5 : 4].attrs['data-sort']) };
        const g = gated.slice(1).find(row => label(row[0].html) === name);
        if (g) for (const [col,k] of [['Hard-gated O-Eval','gated'],['Hard-gated Robust BO-Eval','gatedRobust'],['Hard Gates','gates']]) {
          const value = num(g[gated[0].findIndex(c => c.text === col)]?.text);
          if (value !== undefined) metrics[k] = value;
        }
        rows.push({ model, harness, setting: [mode,effort?.[1] || effort?.[2]].filter(Boolean).join(' / '),
          score, cost: usd ? num(r[4].text) : undefined, metrics });
      }
    }
    return rows;
  },
};
export default board;
