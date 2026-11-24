// LLMEval-Med tests the clinical usability of model responses.
// The makers' leaderboard lists overall usability and five domain rates in percent.
// Discover the current leaderboard script from the page after each deployment.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://llmeval.com/leaderboard';
const domains = {mk: 'Medical Knowledge', mlu: 'Medical Language Understanding', mr: 'Medical Reasoning',
  mse: 'Medical Safety and Ethics', mtg: 'Medical Text Generation'};
interface Entry {model: string, overall: number, mk: number, mlu: number, mr: number, mse: number, mtg: number}
export default {
  benchmark: 'llmeval-med', url: feed, feed,
  terms: 'The benchmark uses CC BY 4.0 at https://huggingface.co/datasets/llmeval-fdu/LLMEval-Med',
  parts: Object.fromEntries(Object.entries(domains).map(([key,name]) => [key,{name,unit: '%' as const}])),
  aliases: {'Mistral-24B': 'mistral-small-3'},
  async fetch() {
    const html = await fetchText(feed);
    const scripts = [...new Set(Array.from(html.matchAll(/<script\b[^>]*\bsrc="(\/_next\/static\/chunks\/[^"]+\.js)"/g), m => m[1]))].reverse();
    for (const path of scripts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const script = await fetchText(new URL(path, feed).href);
      const start = script.search(/\[\{model:"[^"]+",category:"[^"]+",overall:[\d.]+,mk:/);
      if (start < 0) continue;
      const entries = jsLiteral<Entry[]>(script, start);
      return checked(entries.map(({model, overall, mk, mlu, mr, mse, mtg}) => {
        const metrics = {mk, mlu, mr, mse, mtg};
        if (![overall,...Object.values(metrics)].every(v => Number.isFinite(v) && v >= 0 && v <= 100)) {
          throw new Error('Incomplete medical usability rates: ' + model);
        }
        return {model, score: overall, metrics};
      }), 13);
    }
    throw new Error('Missing LLMEval-Med leaderboard data');
  },
} satisfies Leaderboard;
