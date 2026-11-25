// The source reports no overall score. The headline is the plain mean of the 6 parts, computed by this importer.
// NoLiMa measures retrieval with minimal lexical overlap. The Results table gives accuracy for six standard
// context lengths. The starred 64K and 128K extension uses 11 placements instead of 26 and only three models.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://github.com/adobe-research/NoLiMa';
const feed = 'https://raw.githubusercontent.com/adobe-research/NoLiMa/HEAD/README.md';
const lengths = [1, 2, 4, 8, 16, 32, 64, 128];
const board: Leaderboard = {
  benchmark: 'nolima', url, feed,
  terms: 'Adobe licenses its evaluation and needle set for noncommercial research. https://github.com/adobe-research/NoLiMa/blob/main/LICENSE',
  aliases: {
    'GPT-4o': 'gpt-4o-nov-2024', 'Gemini 2.5 Flash': 'gemini-2-5-flash-may-2025',
    'Claude 3.5 Sonnet': 'claude-3-5-sonnet-october-2024', 'Mistral Large 2': 'mistral-large-2-nov-2024',
    'Llama 3.3 70B': 'llama-3-3-70b-instruct', 'Gemini 1.5 Flash': 'gemini-1-5-flash-sep-2024',
  },
  parts: Object.fromEntries(lengths.map(n => ['k'+n, { name: n+'K', group: n <= 32 ? 'Standard lengths' : 'Extended lengths' }])),
  stats: { base: { name: 'Base score', unit: 'score', better: 'higher' }, threshold: { name: 'Base score threshold', unit: 'score' }, effectiveLengthK: { name: 'Effective context length', unit: 'thousands', better: 'higher' }, claimedLengthK: { name: 'Claimed context length', unit: 'thousands' } },
  async fetch() {
    const section = (await fetchText(feed)).split('## Results\n')[1]?.trim().split(/\n\s*\n/)[0];
    if (!section || !section.includes('Effective Length') || !/1K\s*\|\s*2K\s*\|\s*4K\s*\|\s*8K\s*\|\s*16K\s*\|\s*32K\s*\|\s*64K\*\s*\|\s*128K\*/.test(section))
      throw new Error('Missing main NoLiMa results');
    const rows = section.split('\n').slice(2).map(line => {
      const [label, claimed, effective, base, ...scores] = line.split('|').slice(1,-1).map(s => s.replace(/<\/?ins>|\*|🆕/gu, '').trim());
      const reference = base.match(/^([\d.]+) \(([\d.]+)\)$/);
      if (!reference || scores.length !== 8) throw new Error('Unexpected NoLiMa columns');
      const metrics: Record<string, number> = { base: Number(reference[1]), threshold: Number(reference[2]) };
      if (/^\d+K$/.test(effective)) metrics.effectiveLengthK = parseInt(effective);
      else if (effective !== '<1K') throw new Error('Invalid effective length');
      if (/^\d+[KM]$/.test(claimed)) metrics.claimedLengthK = parseInt(claimed) * (claimed.endsWith('M') ? 1000 : 1);
      scores.forEach((value, i) => {
        if (i >= 6 && value === '--') return;
        if (!/^\d+\.\d+$/.test(value)) throw new Error('Missing context length score');
        metrics['k'+lengths[i]] = Number(value);
      });
      return { model: label.replace(' (w/o T)', ''), setting: label.includes('(w/o T)') ? 'Thinking disabled' : undefined,
        metrics, score: lengths.slice(0,6).reduce((sum,n) => sum+metrics['k'+n],0)/6 };
    });
    checked(rows.map(row => ({ ...row })), 22);
    return rows;
  },
};
export default board;
