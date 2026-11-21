// MoI-Bench tests mobile image generation and editing. Table 4 reports overall quality from two judges.
// The operation, target and criterion tables give the published breakdowns for each judge.
import type { BoardPart, Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, flatPaperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2610.37599';
const board: Leaderboard = {
  benchmark: 'moi-bench', static: 'paper', feed, url: feed, terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  stats: { coverage: {name:'Coverage',unit:'score',better:'higher',note:'Fraction of benchmark prompts covered, from 0 to 1.'} },
  async fetch() {
    const paper = (await paperHtml(feed)).replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/g, '');
    const tables = flatPaperTables(paper).map(grid);
    const main = tables.find(t => t[0]?.[3] === 'GPT-4o' && t[0]?.[6] === 'Gemini 3.1 Pro' && t[1]?.[3] === 'Q' && t[1]?.[6] === 'Q');
    if (!main) throw Error('Missing overall quality comparison');
    const parts: Record<string, BoardPart> = {};
    const rows: LeaderboardRow[] = [];
    function quality(v: string) {
      if (!/^(?:0(?:\.\d+)?|1(?:\.0+)?)$/.test(v)) throw Error('Invalid quality score: ' + v);
      return Number(v);
    }
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const row of main.slice(2)) {
      if (row.every(v => v === row[0])) continue;
      const model = row[0].trim();
      for (const i of [3, 6]) {
        const [IF, VQ, DP] = row[i + 2].replace(/[()]/g, '').split(',').map(v => quality(v.trim()));
        const metrics: Record<string, number> = { coverage: quality(row[i + 1]), IF, VQ, DP };
        for (const [name, label] of Object.entries({ IF: 'Instruction following', VQ: 'Visual quality', DP: 'Detail preservation' })) parts[name] = { name: label, group: 'Criterion group' };
        const profiles = i === 3 ? ['T2I', 'Concrete', 'Fidelity'] : ['Gen.'];
        for (const first of profiles) {
          const t = tables.find(t => t[1]?.[1] === first);
          if (!t) throw Error('Missing profile: ' + first);
          const detail = t.slice(2).find(r => normalize(r[0]) === normalize(model));
          if (!detail) continue;
          detail.slice(1).forEach((value, j) => {
            if (['—', '–', '-'].includes(value)) return;
            const name = t[1][j + 1], group = t[0][j + 1], key = group + ': ' + name;
            metrics[key] = quality(value);
            parts[key] = { name, group };
          });
        }
        rows.push({ model, score: quality(row[i]), setting: main[0][i] + ' judge', metrics });
      }
    }
    board.parts = parts;
    return checked(rows, 38);
  },
};
export default board;
