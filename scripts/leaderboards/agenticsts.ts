// AgenticSTS tests memory settings for agents playing Slay the Spire 2. The README
// reports A0 win rates for three backbones. The comparison report adds two external agents.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const root = 'https://raw.githubusercontent.com/AlayaLab/AgenticSTS/HEAD/';
const feed = root + 'README.md';
function game(model: string, setting: string, wins: string, mean: string, harness = 'AgenticSTS'): LeaderboardRow {
  const [won,trials] = wins.split('/').map(Number);
  if (!trials || !Number.isFinite(Number(mean))) throw new Error('Invalid game summary');
  return {model, harness, setting, score: 100 * won/trials, trials, metrics:{meanScore:Number(mean)}};
}
const board: Leaderboard = {
  benchmark: 'agenticsts', url:'https://github.com/AlayaLab/AgenticSTS',feed,
  terms:'The agent code uses Apache 2.0. https://github.com/AlayaLab/AgenticSTS/blob/HEAD/AgenticSTS/LICENSE',
  stats: {
    meanScore: { name: 'Mean score', unit: 'score', better: 'higher' },
    meanFloor: { name: 'Mean floor', unit: 'score', better: 'higher' },
    medianFloor: { name: 'Median floor', unit: 'score', better: 'higher' },
    bosses: { name: 'Bosses defeated', unit: 'count', better: 'higher' },
    meanDecisions: { name: 'Mean decisions per run', unit: 'count' },
  },
  async fetch() {
    const readme = (await fetchText(feed)).replaceAll('**','');
    const results = (await fetchText(root + 'AgenticSTS/docs/experiments/competitor_comparison/RESULTS.md')).replaceAll('**','');
    if (!readme.includes('| Cell | L5 skills | L4 episodes | Wins | Mean score |') || !readme.includes('| Backbone | Wins | Score |')) throw new Error('Missing game tables');
    const rows: LeaderboardRow[] = [];
    for (const m of readme.matchAll(/^\| `([\w-]+)`[^|]*\|[^|]+\|[^|]+\| (\d+\/\d+) \| ([\d.]+) \|/gm)) {
      const row = game('Gemini 3.1-Pro',m[1],m[2],m[3]);
      const interval = readme.match(/Wilson 95% CIs[^\n]*/i)?.[0];
      const pair = interval?.match(/\[\d+,\s*\d+\]/g);
      if (pair?.length === 3) {
        const bounds = pair[row.score === 30 ? 0 : row.score === 40 ? 1 : 2].match(/\d+/g)!.map(Number);
        [row.low,row.high] = bounds;
      }
      rows.push(row);
    }
    for (const m of readme.matchAll(/^\| ([^|]+?) \| (\d+\/\d+) → (\d+\/\d+) \| ([\d.]+) → ([\d.]+) \|/gm)) {
      if (m[1].startsWith('Gemini')) continue;
      rows.push(game(m[1],'baseline-strict',m[2],m[4]),game(m[1],'full-frozen',m[3],m[5]));
    }
    for (const m of results.matchAll(/^\| (STS2MCP|CharTyr)[^|]*\| full accumulating transcript \| (\d+\/\d+) \| ([\d.]+) \| (\d+) \| ([\d.]+) \| (\d+) \| (\d+) \|/gm)) {
      const row = game('Gemini 3.1-Pro','Silent A0',m[2],m[5],m[1]);
      Object.assign(row.metrics!,{meanFloor:+m[3], medianFloor:+m[4], bosses:+m[6], meanDecisions:+m[7]});
      rows.push(row);
    }
    return checked(rows,11);
  },
};
export default board;
