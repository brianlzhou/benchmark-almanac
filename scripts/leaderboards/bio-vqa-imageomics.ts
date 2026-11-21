// Bio-VQA tests biological image understanding. The headline is exact match for phylum, the first task.
// The project results table gives 22 columns with different scoring rules, including discriminability for re-identification.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://smrayeed.github.io/Bio-VQA/';
const groups = [
  ['C1 Taxonomy (exact match)', ['phylum', 'class', 'order', 'family', 'genus', 'species', 'sci. name', 'common']],
  ['C2 Attributes (CAGS)', ['salience', 'morphology', 'localization', 'naming']],
  ['C3 Spatial', ['count', 'rel. count', 'abs. dist.', 'rel. dist.', 'localize', 'rel. pos.', 'viewpoint', 'OCR']],
  ['C4 Re-ID', ['d′', 'acc']],
] as const;
const columns = groups.flatMap(([group, names]) => names.map(name => ({ name, group,
  key: name === 'd′' ? 'dPrime' : name.replace(/[. ]/g, '') })));
const board: Leaderboard = {
  benchmark: 'bio-vqa-imageomics', url: feed, feed,
  terms: 'The authors license benchmark annotations and predictions under CC BY-NC 4.0. https://github.com/Imageomics/Bio-VQA#license',
  aliases: {
    'Qwen3-VL-8B': 'qwen3-vl-8b-instruct',
    'Qwen3-VL-32B': 'qwen3-vl-32b-instruct', 'LLaVA-NeXT-Vicuna': 'llava-v1-6-vicuna-7b',
    'LLaVA-NeXT-Mistral': 'llava-v1-6-mistral-7b', 'Llama-3.2-Vision': 'llama-3-2-11b',
    'Phi-3.5-Vision': 'phi-3-5-vision-instruct',
  },
  parts: Object.fromEntries(columns.map(({ name, group, key }) => [key, { name, group }])),
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0]?.some(c => c.text === groups[0][0]));
    if (!table || JSON.stringify(table[1].map(c => c.text)) !== JSON.stringify(columns.map(c => c.name)))
      throw new Error('Missing Bio-VQA task columns');
    const ranked = table.slice(2).filter(row => row[0].text !== '');
    return checked(ranked.map(row => {
      if (!/^\d+$/.test(row[0].text) || row.length !== columns.length + 2) throw new Error('Unexpected Bio-VQA row');
      const metrics = Object.fromEntries(columns.map(({ key }, i) => {
        const value = row[i+2].text.replace('−', '-');
        if (!/^-?(?:\d+\.?\d*|\.\d+)$/.test(value)) throw new Error('Invalid Bio-VQA score');
        return [key, Number(value)];
      }));
      return { model: row[1].text, score: metrics.phylum, setting: 'Zero-shot, greedy decoding', metrics };
    }), 18);
  },
};
export default board;
