// Proof News reports expert votes on answers to voter questions. The headline is the percentage judged inaccurate.
// The Datawrapper CSV also gives three other ratings and the split votes for every category.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const feed = "https://datawrapper.dwcdn.net/OaSm3/14/dataset.csv";
const board: Leaderboard = {
  benchmark: 'ai-democracy-projects-voter-queries',
  url: "https://datawrapper.dwcdn.net/OaSm3/13/",
  feed,
  terms: "Datawrapper robots.txt has no restriction on this chart. The study links public votes and responses. The repository lists no reuse license. https://github.com/ProofNews/aidp",
  stats: { InaccurateSplit: { name: 'Inaccurate split votes', unit: '%' }, Harmful: { name: 'Harmful votes', unit: '%', better: 'lower' }, HarmfulSplit: { name: 'Harmful split votes', unit: '%' }, Incomplete: { name: 'Incomplete votes', unit: '%', better: 'lower' }, IncompleteSplit: { name: 'Incomplete split votes', unit: '%' }, Biased: { name: 'Biased votes', unit: '%', better: 'lower' }, BiasedSplit: { name: 'Biased split votes', unit: '%' } },
  aliases: { Claude: 'claude-2', Gemini: 'gemini-1-0-pro', 'GPT-4': 'gpt-4-jun-2023', 'Llama 2': 'llama-2-70b', Mixtral: 'mixtral-8x7b' },
  async fetch() {
    const groups = ['Inaccurate', 'Harmful', 'Incomplete', 'Biased'];
    const models = new Map<string, Record<string, number>>();
    let group = '';
    for (const row of parseCsv(await fetchText(feed))) {
      const model = row.Model?.trim();
      if (groups.includes(model)) { group = model; continue; }
      if (!model || !group || !row.Yes?.trim() || !row.Split?.trim()) throw new Error('Missing vote columns');
      const yes = Number(row.Yes), split = Number(row.Split);
      if (![yes, split].every(Number.isFinite)) throw new Error('Invalid vote percentage');
      const ratings = models.get(model) ?? {};
      if (group in ratings) throw new Error('Duplicate vote category for ' + model);
      ratings[group] = yes;
      ratings[group + 'Split'] = split;
      models.set(model, ratings);
    }
    if (models.size < 5) throw new Error('Expected five models');
    return [...models].map(([model, ratings]) => {
      if (groups.some(g => !(g in ratings))) throw new Error('Incomplete ratings for ' + model);
      const { Inaccurate: score, ...metrics } = ratings;
      return { model, score, metrics };
    });
  },
};
export default board;
