// Senior SWE-Bench (Snorkel AI). senior-swe-bench.snorkel.ai/agents is a Next.js page that ships its data
// in the page payload (self.__next_f): a "leaderboard" array (per agent: rate, pass3, tastefulRate and
// more, all 0 to 1) and an "agents" map (display name, model id, harness, reasoning effort). The headline
// is tastefulRate, the share of tasks solved with a tasteful patch (the board's lead figure, for example
// 39.3% for Claude Opus 5.5). Display names end in the harness ("Opus 5.5 (Mini-SWE)"), which is dropped
// from the model name and kept as the harness. avgTokens is not split into input and output, so it is
// not kept.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAt, nextFlight } from '../lib/html.ts';

const PAGE = 'https://senior-swe-bench.snorkel.ai/agents';

interface Entry {
  agentId: string;
  tastefulRate?: number;
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
    const rows: LeaderboardRow[] = [];
    for (const e of entries) {
      const a = agents.get(e.agentId);
      if (!a?.name || typeof e.tastefulRate !== 'number') continue;
      rows.push({
        model: a.name.replace(/\s*\((?:Mini-SWE|[^()]*harness[^()]*)\)$/i, '').trim(),
        score: e.tastefulRate * 100,
        setting: a.effort || undefined,
        harness: a.harness || undefined,
      });
    }
    return rows;
  },
};
export default board;
