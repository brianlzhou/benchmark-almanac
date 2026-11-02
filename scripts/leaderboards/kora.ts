// KORA (AI child safety), Models benchmark V2. korabench.ai/leaderboard is a TanStack Start page: its server
// HTML carries the board in the hydration payload ($R[...]=... assignments), one result per model with
// model:{kind:"api", id, name, type, ...} followed by scorePercent, the "Score" column the board shows
// rounded (GPT-6 Astra 73%). The reasoning setting is read from the model's type ("Reasoning (high)").
// The payload is a JavaScript serialization, not JSON, so each model's name, type and the next scorePercent
// are read with patterns. The Apps board (/apps/leaderboard) rates products and is not read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://korabench.ai/leaderboard';

const board: Leaderboard = {
  benchmark: 'kora',
  url: PAGE,
  feed: `${PAGE} (server-rendered hydration payload, scorePercent)`,
  terms: 'robots.txt allows / for all user agents except named AI crawlers (content signal use=reference, ai-train=no); the KORA benchmark repository is open source and the site terms do not restrict reading.',
  aliases: {
    'Claude Haiku 3.5': 'claude-3-5-haiku',
    'Ministral 14B': 'ministral-3-14b',
    'Mistral Large 4 (Preview)': 'mistral-large-4',
    'Grok 4.1 Fast Reasoning': 'grok-4-1-fast',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(PAGE);
    const re = /model:\$R\[\d+\]=\{kind:"api",id:"[^"]+",maker:\$R\[\d+\]=\{[^}]*\},name:"([^"]+)",[^}]*?type:"([^"]*)"/g;
    const hits = [...html.matchAll(re)];
    const rows: LeaderboardRow[] = [];
    hits.forEach((m, i) => {
      const end = hits[i + 1]?.index ?? html.length;
      const score = html.slice(m.index! + m[0].length, end).match(/scorePercent:([\d.]+)/)?.[1];
      if (!score) return;
      const effort = /Reasoning \((\w+)\)/.exec(m[2])?.[1]?.toLowerCase();
      rows.push({ model: m[1], score: Number(score), setting: effort });
    });
    if (rows.length < 10) throw new Error(`only ${rows.length} KORA rows found`);
    return rows;
  },
};
export default board;
