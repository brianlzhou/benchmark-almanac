// DaLAJ-GED 2.0 reports test agreement on the SuperLim leaderboard. The National Library of Sweden publishes the scores in its results page bundle.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://lab.kb.se/leaderboard/_nuxt/results.67b82063.js";


type Scores = Record<string, { test?: Record<string, number | null> }>;
const measures: Record<string, string> = {
  'absabank-imm': 'alpha', 'argumentation-sentences': 'alpha', 'dalaj-ged-superlim': 'alpha',
  'supersim-superlim-relatedness': 'alpha', 'supersim-superlim-similarity': 'alpha', sweanalogy: 'pseudoalpha',
  swediagnostics: 'alpha', swedn: 'rouge1', swefaq: 'pseudoalpha', swenli: 'alpha', sweparaphrase: 'alpha',
  'swesat-synonyms': 'pseudoalpha', swewic: 'alpha', swewinogender: 'alpha', swewinograd: 'alpha',
};

export async function superlimRows(task: string | undefined, minimum: number, percent = false): Promise<LeaderboardRow[]> {
  const source = await fetchText(feed);
  const rows: LeaderboardRow[] = [];
  for (const entry of source.split('{repo_link:').slice(1)) {
    const model = entry.match(/model_name:"([^"]+)"/)?.[1];
    const params = Number(entry.match(/number_params:([^,}]+)/)?.[1]);
    const literal = entry.match(/,tasks:(\{.*?\})(?:,model_card:|\},\{|\}\])/s)?.[1] ?? entry.match(/,tasks:(\{.*?\})\},$/s)?.[1];
    if (!model || !literal) throw new Error('Missing model or task data in SuperLim bundle');
    // Only normalize the score object. Model card strings and executable code stay outside the parser.
    const scores: Scores = JSON.parse(literal.replace(/([{,])([\w-]+):/g, '$1"$2":').replace(/:(-?)\./g, ':$10.'));
    const metrics: Record<string, number> = {};
    let score: number;
    if (task) {
      const test = scores[task]?.test;
      const headline = test?.[percent ? 'accuracy' : measures[task]];
      if (headline == null) continue;
      score = percent ? 100 * headline : headline;
      for (const [key, value] of Object.entries(test!)) if (typeof value === 'number') metrics[key] = value;
    } else {
      for (const [key, measure] of Object.entries(measures)) {
        const value = scores[key]?.test?.[measure];
        if (typeof value === 'number' && value !== 0) metrics[key] = value;
      }
      const values = Object.values(metrics);
      if (!values.length) continue;
      score = values.reduce((sum, v) => sum + v, 0) / values.length;
    }
    rows.push({ model, score, metrics, params: Number.isFinite(params) ? params / 1e9 : undefined });
  }
  if (rows.length < minimum) throw new Error('Incomplete SuperLim test results');
  return rows;
}

const board: Leaderboard = {
  benchmark: "dalaj-ged-2",
  url: "https://lab.kb.se/leaderboard/results",
  feed,
  terms: "The authors release DaLAJ-GED under CC BY 4.0. The leaderboard gives no separate score license. https://sprakbanken.se/en/resources/dalaj-ged-superlim The feed host returns no robots.txt.",
  async fetch() {
    return superlimRows("dalaj-ged-superlim", 13);
  },
};
export default board;
