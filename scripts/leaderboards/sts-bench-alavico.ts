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
