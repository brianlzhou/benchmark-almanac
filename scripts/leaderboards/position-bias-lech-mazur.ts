// Position Bias ranks judges by the percentage of decisive pairs where they reverse their choice after the order swap.
// The repository's model_metrics.csv holds all evaluated models, while the README highlights the newest subset.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { LECH_MAZUR_ALIASES } from './nyt-connections-extended.ts';

const feed = 'https://raw.githubusercontent.com/lechmazur/position_bias/HEAD/data/results/model_metrics.csv';

function parseModelSlug(slug: string): { model: string; setting?: string } {
  const m = slug.match(/^(.+?)-(xhigh|high|medium|none|0K|adaptive|non-reasoning|reasoning|thinking)$/);
  if (!m) return { model: slug };
  // Keep "trinity-large-thinking" as the model name since Thinking is part of the model identity.
  if (slug === 'trinity-large-thinking') return { model: slug };
  const s = m[2];
  const setting = s === '0K' ? 'thinking 0K' : s === 'non-reasoning' ? 'non-reasoning' : s;
  return { model: m[1], setting };
}

const board: Leaderboard = {
  benchmark: 'position-bias-lech-mazur',
  stats: {
    firstPick: { name: 'First-shown pick', unit: '%', better: 'higher' },
    firstLift: { name: 'First lift', unit: 'score', better: 'higher' },
    coverage: { name: 'Decisive pair coverage', unit: '%', better: 'higher' },
    ratingBonus: { name: 'Rating bonus', unit: 'score', better: 'higher' },
  },
  url: 'https://github.com/lechmazur/position_bias',
  feed,
  terms: 'The publisher displays results at https://github.com/lechmazur/position_bias. I could not verify reuse terms. The raw file host serves no robots.txt rules.',
  aliases: {
    ...LECH_MAZUR_ALIASES,
    'deepseek-v32-exp': 'deepseek-v3-2',
    'mistral-medium-2508': 'mistral-medium-3-1',
    'mistral-large-2512': 'mistral-large-3',
    'ernie-5': 'ernie-5-0',
    'grok-4.20-beta-0309': 'grok-4-20',
  },
  async fetch() {
    const records = parseCsv(await fetchText(feed));
    if (records.length < 36) throw new Error('Incomplete leaderboard');
    const rows: LeaderboardRow[] = [];
    for (const r of records) {
      const num = (col: string) => {
        const v = Number(r[col]);
        if (!r[col] || !Number.isFinite(v)) throw new Error('Invalid ' + col + ' for ' + r.model);
        return v;
      };
      const { model, setting } = parseModelSlug(r.model);
      rows.push({
        model,
        setting,
        score: num('order_flip') * 100,
        metrics: {
          firstPick: num('displayed_first_rate_prompt') * 100,
          firstLift: num('displayed_first_lift_prompt') * 100,
          coverage: num('decisive_pair') * 100,
          ratingBonus: num('first_position_rating_bonus'),
        },
      });
    }
    return rows;
  },
};
export default board;
