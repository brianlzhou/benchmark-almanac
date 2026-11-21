// CLEVA evaluates Chinese language models. HELM’s Accuracy table ranks them by mean win rate across scenarios, on its published zero-to-one scale.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://storage.googleapis.com/crfm-helm-public/cleva/benchmark_output/releases/v1.0.0/groups/cleva_scenarios.json";
interface Table { title: string; header: {value: string}[]; rows: {value: string | number | null}[][] }
const clevaSubjects = ['Classical Chinese understanding','Commonsense reasoning','Coreference resolution','Cultural knowledge','Mathematical calculation','Mathematical reasoning','Paraphrase generation','Paraphrase identification','Pinyin transliteration','Reading comprehension','Sentiment analysis','Summarization','Text classification','Toxicity detection','Translation'];
const clevaStats = Object.fromEntries(clevaSubjects.flatMap((subject) => [
  [`General information: ${subject} - # eval`, { name: `${subject} evaluation examples`, unit: 'count' }],
  [`General information: ${subject} - # train`, { name: `${subject} training examples`, unit: 'count' }],
  [`General information: ${subject} - # prompt tokens`, { name: `${subject} prompt tokens`, unit: 'tokens' }],
  [`General information: ${subject} - # output tokens`, { name: `${subject} output tokens`, unit: 'tokens' }],
  [`General information: ${subject} - truncated`, { name: `${subject} truncated output rate`, unit: 'score', better: 'lower', note: 'Fraction from 0 to 1.' }],
].map(([key, stat]) => [key, stat])).filter(([key]) => !String(key).includes('Paraphrase identification - # output tokens') && !String(key).includes('Commonsense reasoning - # output tokens') && !String(key).includes('Coreference resolution - # output tokens') && !String(key).includes('Text classification - # output tokens') && !String(key).includes('Toxicity detection - # output tokens') && (!String(key).endsWith(' - truncated') || String(key).includes('Reading comprehension') || String(key).includes('Summarization'))));

const board: Leaderboard = {
  benchmark: "cleva",
  url: "https://crfm.stanford.edu/helm/cleva/latest/",
  feed: FEED,
  terms: "Stanford licenses the HELM code under Apache 2.0. The results table gives no separate reuse terms. https://github.com/stanford-crfm/helm/blob/63754d05db6f874e41a395880fb573890a13e791/LICENSE",
  stats: clevaStats,
  aliases: {"Vicuna v1.3 (13B)":"vicuna-13b-v1-3"},
  async fetch() {
    const tables = await fetchJson<Table[]>(FEED);
    const accuracy = tables.find(t => t.title === 'Accuracy');
    if (!accuracy || accuracy.header[1]?.value !== 'Mean win rate' || accuracy.header.length < 17 || accuracy.rows.length < 4)
      throw new Error('Incomplete CLEVA Accuracy table');
    board.parts = Object.fromEntries(accuracy.header.slice(2).map(h => [h.value, h.value]));
    return accuracy.rows.map(cells => {
      const model = cells[0].value;
      const score = cells[1].value;
      if (typeof model !== 'string' || typeof score !== 'number') throw new Error('Invalid CLEVA headline');
      const metrics: Record<string, number> = {};
      for (const table of tables) {
        const row = table.rows.find(r => r[0].value === model);
        if (!row || row.length !== table.header.length) throw new Error('Incomplete CLEVA table for ' + model);
        for (const [i, {value}] of row.entries()) {
          if (i === 0 || (table === accuracy && i === 1) || typeof value !== 'number') continue;
          const column = table.header[i].value;
          metrics[table === accuracy ? column : table.title + ': ' + column] = value;
        }
      }
      return { model, score, metrics };
    });
  },
};
export default board;
