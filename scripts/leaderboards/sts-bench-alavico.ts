// Slay the Spire Bench ranks configurations by the mean floor reached.
// The campaign report embeds statistics for each ascension, agent and reasoning setting.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const feed = "https://alavico.github.io/sts-bench-results/";
type Config = { label: string; model: string; agent: string; effort?: string; ascension: number; mean_floor: number; n: number;
  cost_per_run?: number; mean_completion_tokens?: number };

const board: Leaderboard = {
  benchmark: "sts-bench-alavico",
  url: "https://alavico.github.io/sts-bench-results/",
  feed,
  terms: "The runner uses MIT. The separate results repository lists no license. The host has no robots.txt.",
  costPer: 'run',
  chart: {
    title: 'Cost vs. performance',
    note: 'Mean floor reached against mean estimated cost per attempted run, matching the cost versus performance scatter chart on the Slay the Spire Bench report.',
    x: { key: 'cost', label: 'Mean cost per run', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Mean floor', unit: 'score', better: 'higher' },
  },
  stats: {
    wins: { name: 'Wins', unit: 'count', better: 'higher', note: 'Outright wins out of attempted runs.' },
    median_floor: { name: 'Median floor', unit: 'score', better: 'higher' },
    best_floor: { name: 'Best floor', unit: 'score', better: 'higher', note: 'Deepest floor reached in one run.' },
    skip_rate: { name: 'Card skip rate', unit: 'score', note: 'Card rewards declined out of card-reward decisions, from 0 to 1.' },
    potion_use_rate: { name: 'Potion use rate', unit: 'score', note: 'Potions used out of potions acquired, from 0 to 1.' },
    gold_spent_ratio: { name: 'Gold spent ratio', unit: 'score', note: 'Gold spent out of starting gold plus gold earned, from 0 to 1.' },
    invalid_rate: { name: 'Invalid decision rate', unit: 'score', better: 'lower', note: 'Decisions with at least one rejected action out of all decisions, from 0 to 1.' },
    forced_rate: { name: 'Forced action rate', unit: 'score', note: 'Forced actions per decision, from 0 to 1.' },
    lookups_per_decision: { name: 'Observation lookups per decision', unit: 'count' },
    latency_p50_ms: { name: 'Median latency', unit: 'ms', better: 'lower', note: 'Median model response time per decision.' },
    mean_prompt_tokens: { name: 'Input tokens', unit: 'tokens' },
    mean_completion_tokens: { name: 'Output tokens', unit: 'tokens' },
    cost_per_run: { name: 'Cost per run', unit: 'usd', better: 'lower', note: 'Mean estimated dollar cost per attempted run.' },
  },
  async fetch() {
    const { configs } = jsonAfter<{ configs: Config[] }>(await fetchText(feed), 'id="data">');
    if (configs.length < 27) throw new Error('Incomplete campaign results');
    return configs.map(c => {
      if (!Number.isFinite(c.mean_floor) || !c.n || !c.label) throw new Error('Missing campaign score');
      const revisions = configs.filter(r => r.label === c.label && r.ascension === c.ascension);
      const revision = revisions.length > 1 ? ', revision ' + (revisions.indexOf(c) + 1) : '';
      return { model: c.model ?? c.agent, score: c.mean_floor, harness: c.agent,
        setting: 'Ascension ' + c.ascension + (c.effort ? ', ' + c.effort + ' effort' : '') + revision,
        trials: c.n, cost: c.cost_per_run ?? undefined, tokens: c.mean_completion_tokens ?? undefined,
        metrics: Object.fromEntries(Object.entries(c).filter(([k,v]) => typeof v === 'number' && !['n','ascension','mean_floor'].includes(k))) as Record<string, number> };
    });
  },
};
export default board;
