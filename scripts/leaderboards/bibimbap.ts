// BIBIMBAP tests natural-language BIM edits. The authors publish overall percentage, task categories and CRUD success in two tables.
import type { Leaderboard } from "./types.ts";
import { fetchText } from "../lib/util.ts";
import { num, tables } from "../lib/html.ts";
const board: Leaderboard = {
  benchmark: "bibimbap",
  url: "https://nbharathik.github.io/bibimbap/#results",
  feed: "https://nbharathik.github.io/bibimbap/#results",
  terms: "The authors license the project website under CC BY-SA 4.0. The table reports the original paper's baselines. https://nbharathik.github.io/bibimbap/ robots.txt allows this page.",
  stats: { standardDeviation: { name: 'Standard deviation', unit: 'score' } },
  async fetch() {
    const tabs = tables(await fetchText(this.url));
    const main = tabs.find(t => t[0]?.at(-1)?.text === 'Overall Score');
    const crud = tabs.find(t => t[0]?.[1]?.text === 'Create');
    if (!main || !crud || main.length < 7 || main.length !== crud.length) throw new Error('Missing BIBIMBAP results');
    const parts = [...main[0].slice(1,-1), ...crud[0].slice(1)].map(c => c.text.replace(/ \(20\)$/, ''));
    if (parts.length !== 9) throw new Error('Missing BIBIMBAP categories');
    this.parts = Object.fromEntries(parts.map(p => [p,p]));
    return main.slice(1).map(r => {
      const other = crud.find(row => row[0].text === r[0].text);
      if (!other) throw new Error('Missing CRUD row');
      const cells = [...r.slice(1,-1), ...other.slice(1)];
      const metrics: Record<string,number> = {};
      const read = (value:string) => { const n = num(value); if (n === undefined) throw new Error('Missing score'); return n; };
      parts.forEach((p,i) => { metrics[p] = read(cells[i].text); });
      const [value,sd] = r.at(-1)!.text.split(/&plusmn;|±/);
      if (sd) metrics.std = read(sd);
      return { model:r[0].text.replace(/\*$/, ''), score:read(value), trials:sd ? 3 : 1, metrics };
    });
  },
};
export default board;
