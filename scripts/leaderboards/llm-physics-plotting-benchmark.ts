// The physics plotting report measures the fraction of passing trials for each model and workflow. Its page embeds trial records and the context groups used by its filters.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const FEED = "https://gordonwatts.github.io/hep-data-llm/";
interface Trial { model: string; profile: string; context: string; success: boolean; cost: number | null; time: number | null; question: number }
interface Setup { profile: string; contexts: string[]; label: string; count: number }

const board: Leaderboard = {
  benchmark: "llm-physics-plotting-benchmark",
  url: "https://gordonwatts.github.io/hep-data-llm/",
  feed: FEED,
  terms: "The MIT license covers repository software and documentation. The report embeds trial data and counts model configurations. https://github.com/gordonwatts/hep-data-llm/blob/main/LICENSE.txt The robots URL returns HTML.",
  async fetch() {
    const page = await fetchText(FEED);
    const trials = jsonAfter<Trial[]>(page, 'const reportRecords=');
    const setups = jsonAfter<Setup[]>(page, 'setups=');
    if (trials.length < 3138 || setups.length < 5) throw new Error('Missing plotting report data');
    const parts: Record<string,string> = {};
    const rows = setups.flatMap(setup => {
      const groups = new Map<string,Trial[]>();
      const records = trials.filter(t => setup.profile === t.profile && setup.contexts.includes(t.context));
      if (records.length !== setup.count) throw new Error('Wrong workflow trial count');
      for (const t of records) {
        if (!t.model || typeof t.success !== 'boolean') throw new Error('Invalid trial');
        const group = groups.get(t.model) ?? []; group.push(t); groups.set(t.model,group);
      }
      return Array.from(groups, ([model,group]) => {
        const passed = group.filter(t => t.success);
        const mean = (v: (number|null)[]) => { const n = v.filter((x): x is number => typeof x === 'number'); return n.length ? n.reduce((a,b) => a+b,0)/n.length : undefined; };
        const metrics: Record<string,number> = { passed: passed.length };
        const time = mean(passed.map(r => r.time)); if (time != null) metrics.timePerGoodTrial = time;
        const goodCost = mean(passed.map(r => r.cost)); if (goodCost != null) metrics.costPerGoodTrial = goodCost;
        for (const q of new Set(group.map(t => t.question))) {
          const part = group.filter(t => t.question === q); const key = 'Q'+q;
          parts[key] = key; metrics[key] = 100 * part.filter(t => t.success).length / part.length;
        }
        return { model, setting: setup.label, score: 100 * passed.length / group.length, trials: group.length, cost: mean(group.map(t => t.cost)), metrics };
      });
    });
    board.parts = parts;
    return rows;
  },
};
export default board;
