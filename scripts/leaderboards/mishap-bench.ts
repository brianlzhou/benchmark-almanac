// MISHAP-Bench tests audio-language hallucinations. The headline is the percentage of answers with a hallucination.
// Tables 1 and 8 give audio domain results. Tables 11 and 12 give the category breakdown for the same runs.
import type { Leaderboard, LeaderboardRow, BoardPart } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2609.33893';
const domains = ['Music', 'Sound', 'Speech'].flatMap(g => ['Context', 'Knowledge', 'Overall'].map(n => [g, n]));
const categories = [
  ...['Contradicted Premise', 'Absent Premise', 'False Negation', 'Overall'].map(n => ['Context', n]),
  ...['Niche Specifics', 'Unknowable Provenance', 'False Authority', 'False Premise', 'Overall'].map(n => ['Knowledge', n]),
];
const parts: Record<string, BoardPart> = Object.fromEntries([...domains, ...categories].map(([group, name]) => [group + ': ' + name, { group, name }]));
const board: Leaderboard = {
  benchmark: 'mishap-bench', url: feed, feed, static: 'paper', parts,
  terms: 'The authors list the paper license at https://arxiv.org/abs/2609.33893.',
  aliases: { 'Qwen2-Audio Instruct': 'qwen2-audio-7b-instruct', 'Qwen2.5-Omni': 'qwen2-5-omni-7b',
    'Kimi-Audio Instruct': 'kimi-audio-7b-instruct', 'MiMo-Audio Instruct': 'mimo-audio-7b-instruct',
    'Qwen3-Omni Instruct': 'qwen3-omni-30b-a3b' },
  async fetch() {
    const figures = [...(await paperHtml(feed)).matchAll(/<figure\b[^>]*class="[^"]*ltx_table[^"]*"[^>]*>([\s\S]*?)<\/figure>/g)];
    const results = new Map<string, LeaderboardRow>();
    for (const n of [1, 8, 11, 12]) {
      const cols = n < 10 ? domains : categories;
      const grouped = n === 8 || n === 12;
      const figure = figures.find(f => f[1].includes('Table ' + n + ':'));
      const t = figure && flatPaperTables(figure[1]).map(grid)[0];
      const names = [grouped ? 'Method' : 'Model', ...cols.map(c => c[1]), 'Overall'];
      if (!t || t[1]?.map(c => c.replace(' \\downarrow', '')).join('|') !== names.join('|') ||
        t[0].slice(1, -1).join('|') !== cols.map(c => c[0]).join('|')) throw new Error('Missing MISHAP Table ' + n);
      let model = '';
      for (const [label, ...cells] of t.slice(2)) {
        if (cells.every(c => c === label)) {
          if (grouped) model = label;
          continue;
        }
        if (!grouped) model = label;
        if (grouped && label === 'W/O') continue;
        const setting = grouped ? label : 'W/O';
        const key = model + '|' + setting;
        const score = numberCell(cells[9]);
        const row = results.get(key) ?? { model, score, setting, metrics: {} };
        if (!model || cells.length !== 10 || row.score !== score) throw new Error('Inconsistent results for ' + key);
        cols.forEach(([g, name], i) => { row.metrics![g + ': ' + name] = numberCell(cells[i]); });
        results.set(key, row);
      }
    }
    if ([...results.values()].some(r => Object.keys(r.metrics!).length !== 18)) throw new Error('Missing category scores');
    return checked([...results.values()], 42);
  },
};
export default board;
