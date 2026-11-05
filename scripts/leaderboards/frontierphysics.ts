// FrontierPhysics on benchflow.ai. The page's leaderboard table (# | Agent | Verifier | Overall | Pass@3 |
// Score) and its charts are built from one JSON file bundled into a page script,
// /frontierphysics/_next/static/immutable/chunks/<hash>.js, as `JSON.parse('{"source":...,"agents":[...]}')`.
// The chunk name changes with each release, so the page is read first for its script list, and each script
// is read as text, never run. Each agent names the model as the table shows it ("GPT-6 Astra (max)", the
// effort in parentheses kept as the setting) and the agent it ran in ("Claude Code"), kept as the harness.
// The page ranks by Overall (overall.avg3, 0 to 100), which is the score. Each row also keeps, per rollout
// (one trial of one task): the mean inference cost in US dollars (cost.perRollout), the output tokens
// (outputTokens.perRollout), and in metrics the wall-clock minutes ("minutes") and agent steps ("steps"),
// plus Pass@3 ("passAt3") and the 95% confidence interval of Overall ("ci"). The "Agent Performance" chart
// plots Overall against minutes with a Pareto frontier.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const URL = 'https://www.benchflow.ai/frontierphysics';

interface PerRollout {
  perRollout?: number;
}
interface Agent {
  model: string;
  harness?: string;
  overall?: { avg3?: number; ci?: number; pass3?: number };
  cost?: PerRollout;
  outputTokens?: PerRollout;
  minutes?: PerRollout;
  steps?: PerRollout;
}

/** The value of the JavaScript single-quoted string literal that starts at `from` (just after the quote). */
function jsString(s: string, from: number): string {
  let out = '';
  for (let i = from; i < s.length; i++) {
    const c = s[i];
    if (c === "'") return out;
    if (c !== '\\') {
      out += c;
      continue;
    }
    const e = s[++i];
    if (e === 'u') {
      out += String.fromCharCode(parseInt(s.slice(i + 1, i + 5), 16));
      i += 4;
    } else if (e === 'x') {
      out += String.fromCharCode(parseInt(s.slice(i + 1, i + 3), 16));
      i += 2;
    } else out += ({ n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' } as Record<string, string>)[e] ?? e;
  }
  throw new Error('unterminated string literal');
}

const finite = (x: number | undefined) => (typeof x === 'number' && Number.isFinite(x) ? x : undefined);

const board: Leaderboard = {
  benchmark: 'frontierphysics',
  url: URL,
  feed: `${URL} (agents JSON in the page's script chunks: overall.avg3, costs and times per rollout)`,
  terms: 'Server-rendered public page; the site has no robots.txt restrictions and no terms.',
  aliases: {},
  chart: {
    title: 'Agent Performance',
    note: 'Overall pass rate against the average agent wall-clock time per rollout, on a log scale; the board marks the Pareto frontier.',
    x: { key: 'minutes', label: 'Wall-clock per rollout', unit: 'min', better: 'lower', log: true },
    y: { key: 'score', label: 'Overall pass rate', unit: '%', better: 'higher' },
  },
  async fetch() {
    const html = await fetchText(URL);
    const scripts = [...new Set([...html.matchAll(/src="(\/frontierphysics\/_next\/static\/[^"]+\.js)"/g)].map((m) => m[1]))];
    let agents: Agent[] | undefined;
    for (const src of scripts) {
      const js = await fetchText(new globalThis.URL(src, URL).href);
      const at = js.indexOf(`JSON.parse('{"source":`);
      if (at < 0 || !js.includes('"agents":[', at)) continue;
      agents = (JSON.parse(jsString(js, at + "JSON.parse('".length)) as { agents?: Agent[] }).agents;
      break;
    }
    if (!agents?.length) throw new Error(`no agents JSON in the ${scripts.length} FrontierPhysics scripts`);
    const rows: LeaderboardRow[] = [];
    for (const a of agents) {
      const score = finite(a.overall?.avg3);
      if (!a.model || score === undefined) continue;
      const effort = a.model.match(/\s*\(([^()]+)\)$/);
      const metrics: Record<string, number> = {};
      for (const [k, v] of [
        ['minutes', a.minutes?.perRollout],
        ['steps', a.steps?.perRollout],
        ['passAt3', a.overall?.pass3],
        ['ci', a.overall?.ci],
      ] as const)
        if (finite(v) !== undefined) metrics[k] = v as number;
      rows.push({
        model: effort ? a.model.slice(0, effort.index).trim() : a.model.trim(),
        score,
        setting: effort?.[1].toLowerCase(),
        harness: a.harness || undefined,
        cost: finite(a.cost?.perRollout),
        tokens: finite(a.outputTokens?.perRollout),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    if (!rows.length) throw new Error('no rows in the FrontierPhysics agents JSON');
    return rows;
  },
};
export default board;
