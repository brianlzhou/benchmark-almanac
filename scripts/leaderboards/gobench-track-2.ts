// GoBench Track 2 evaluates coding agents that spend 1 to 8 hours writing a 9x9 Go engine
// without internet or KataGo access, then play the compiled engine at 1 minute per game.
// Reads the rendered Track 2 table and Next.js player data from the official leaderboard page.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { readGoBenchPage } from './gobench.ts';

const PAGE = 'https://rolandgao.com/blog/gobench/';

const board: Leaderboard = {
  benchmark: 'gobench-track-2',
  url: PAGE,
  feed: `${PAGE} (__NEXT_DATA__ Track 2 standings)`,
  terms: 'The author publishes the benchmark code and summary results under the MIT License at https://github.com/RolandGao/gobench/blob/main/LICENSE and rolandgao.com robots.txt allows the leaderboard page.',
  harnesses: 'system',
  costPer: 'run',
  chart: {
    title: 'Elo versus continual learning duration',
    x: { key: 'learningHours', label: 'Continual learning duration', unit: 'hours', better: 'lower', log: true },
    y: { key: 'score', label: 'Elo', unit: 'Elo', better: 'higher' },
    note: 'Track 2 coding agents spend 1 to 8 hours building a 9x9 Go engine, evaluated at 1 minute per game.',
  },
  stats: {
    learningHours: { name: 'Continual learning duration', unit: 'hours', better: 'lower' },
    secondsPerMove: { name: 'Seconds per move', unit: 'seconds', better: 'lower' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(PAGE);
    const { llm_players = [] } = readGoBenchPage(html);
    const track2Players = llm_players.filter(p => p.track === 2);
    const table = tables(html).find(t =>
      t[0]?.map(c => c.text).join('|') === 'Model|Hours|Elo ± 95% CI|Learning cost' &&
      t.slice(1).some(r => r[0]?.text.includes('Codex') || r[0]?.text.includes('Claude Code')) &&
      !t.slice(1).some(r => r[0]?.text.startsWith('KataGo student')),
    );
    if (!table || table.length < 6) throw new Error('Missing GoBench Track 2 table');

    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const label = cells[0]?.text ?? '';
      const hours = Number(cells[1]?.text);
      const eloMatch = cells[2]?.text.match(/^([\d,]+)\s*±\s*([\d,]+)$/);
      const costMatch = cells[3]?.text.match(/^\$([\d.,]+)$/);
      if (!label || !Number.isFinite(hours) || !eloMatch || !costMatch) throw new Error('Invalid GoBench Track 2 row: ' + label);
      const [model, harness] = label.split(/\s*·\s*/);
      if (!model || !harness) throw new Error('Missing model or harness in GoBench Track 2: ' + label);
      const score = Number(eloMatch[1].replaceAll(',', ''));
      const margin = Number(eloMatch[2].replaceAll(',', ''));
      const tableCost = Number(costMatch[1].replaceAll(',', ''));

      const match = track2Players.find(p =>
        p.elo === score &&
        p.player.endsWith(`-${hours}h`) &&
        p.learning_cost_usd != null &&
        Math.abs(p.learning_cost_usd - tableCost) < 0.02,
      );
      const low = match?.ci_low ?? score - margin;
      const high = match?.ci_high ?? score + margin;
      const cost = match?.learning_cost_usd ?? tableCost;
      const metrics: Record<string, number> = { learningHours: hours };
      if (typeof match?.api_seconds_per_move === 'number' && Number.isFinite(match.api_seconds_per_move)) {
        metrics.secondsPerMove = match.api_seconds_per_move;
      }
      rows.push({
        model,
        harness,
        setting: `${hours} ${hours === 1 ? 'hour' : 'hours'}`,
        score,
        low,
        high,
        cost,
        metrics,
      });
    }
    if (rows.length < 10) throw new Error(`Expected at least 10 GoBench Track 2 rows, found ${rows.length}`);
    return rows;
  },
};

export default board;
