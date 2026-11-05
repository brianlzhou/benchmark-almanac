// Senior SWE-Bench (Snorkel AI). senior-swe-bench.snorkel.ai/agents is a Next.js page that ships its data
// in the page payload (self.__next_f): a "leaderboard" array (per agent: rate, pass3, tastefulRate and
// more, all 0 to 1) and an "agents" map (display name, model id, harness, reasoning effort). The headline
// is tastefulRate, the share of tasks solved with a tasteful patch (the board's lead figure, for example
// 39.3% for Claude Opus 5.5). Display names end in the harness ("Opus 5.5 (Mini-SWE)"), which is dropped
// from the model name and kept as the harness. avgTokens is the table's "Output tokens" column, kept as
// tokens. The "pareto" block (series tiers and dots, per model and effort) gives the cost: totalCost, the
// board's approximate total token cost per task at list prices (its "Total $" column and a Pareto x-axis;
// the default "Output $" counts output tokens only), and steps, metrics.steps. metrics.pass3 is
// tastefulAll3 (tasteful in all three attempts, pass^3) and metrics.passAt3 is tasteful3 (pass@3).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAt, nextFlight } from '../lib/html.ts';

const PAGE = 'https://senior-swe-bench.snorkel.ai/agents';

interface Entry {
  agentId: string;
  tastefulRate?: number;
  tasteful3?: number;
  tastefulAll3?: number;
  avgTokens?: number;
}
interface Tier {
  model?: string;
  effort?: string | null;
  totalCost?: number | null;
  steps?: number | null;
}
interface Agent {
  id: string;
  name?: string;
  model?: string;
  harness?: string;
  effort?: string | null;
}

const board: Leaderboard = {
  benchmark: 'senior-swe-bench',
  url: PAGE,
  feed: `${PAGE} (Next.js page payload: leaderboard and agents)`,
  terms: 'Data embedded in the public page (robots.txt allows it and disallows only /api/ and /unlock); Snorkel publishes no terms for the site.',
  aliases: {
    // anthropic/claude-horchata-eap, which the page names Opus 5
    'Opus 5': 'claude-opus-5',
  },
  async fetch() {
    const flight = nextFlight(await fetchText(PAGE));
    const lb = flight.indexOf('"leaderboard":[');
    const ag = flight.indexOf('"agents":[{"id"');
    if (lb < 0 || ag < 0) throw new Error('no leaderboard or agents array in the Senior SWE-Bench payload');
    const entries = jsonAt<Entry[]>(flight, lb + '"leaderboard":'.length);
    const agents = new Map(jsonAt<Agent[]>(flight, ag + '"agents":'.length).map((a) => [a.id, a]));
    // cost and steps per model and effort; names there may add the maker ("Claude Opus 5.5" for "Opus 5.5")
    const key = (model: string, effort?: string | null) => `${model.toLowerCase().replace(/^claude /, '')}|${effort ?? ''}`;
    const tiers = new Map<string, Tier>();
    const pa = flight.indexOf('"pareto":{');
    if (pa >= 0) {
      const pareto = jsonAt<{ series?: { model: string; tiers: Tier[] }[]; dots?: Tier[] }>(flight, pa + '"pareto":'.length);
      for (const se of pareto.series ?? []) for (const t of se.tiers) tiers.set(key(se.model, t.effort), t);
      for (const d of pareto.dots ?? []) if (d.model) tiers.set(key(d.model, d.effort), d);
    }
    const pct = (x?: number) => (typeof x === 'number' ? x * 100 : undefined);
    const rows: LeaderboardRow[] = [];
    for (const e of entries) {
      const a = agents.get(e.agentId);
      if (!a?.name || typeof e.tastefulRate !== 'number') continue;
      const model = a.name.replace(/\s*\((?:Mini-SWE|[^()]*harness[^()]*)\)$/i, '').trim();
      const tier = tiers.get(key(model, a.effort));
      const metrics: Record<string, number> = {};
      for (const [k, v] of [['pass3', pct(e.tastefulAll3)], ['passAt3', pct(e.tasteful3)], ['steps', tier?.steps ?? undefined]] as const) if (typeof v === 'number') metrics[k] = v;
      rows.push({
        model,
        score: e.tastefulRate * 100,
        setting: a.effort || undefined,
        harness: a.harness || undefined,
        cost: typeof tier?.totalCost === 'number' && tier.totalCost > 0 ? tier.totalCost : undefined,
        tokens: typeof e.avgTokens === 'number' && e.avgTokens > 0 ? Math.round(e.avgTokens) : undefined,
        metrics: Object.keys(metrics).length ? metrics : undefined,
      });
    }
    return rows;
  },
};
export default board;
