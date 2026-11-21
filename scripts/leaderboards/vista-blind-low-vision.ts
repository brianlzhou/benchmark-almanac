// VISTA rates zero-shot vision-language responses on a five-point scale. Its results table reports overall score, rubric components and three response types.
import type { Leaderboard } from './types.ts';
import { tables, num } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://harvard-ai-and-robotics-lab.github.io/VISTA/#zero-shot-results";
const board: Leaderboard = {
  benchmark: 'vista-blind-low-vision',
  url: "https://harvard-ai-and-robotics-lab.github.io/VISTA/#zero-shot-results",
  feed,
  terms: "The site has no robots file. The dataset card lists CC BY 4.0. The results page gives no separate license for its table. https://huggingface.co/datasets/harvardairobotics/VISTA",
  parts: { Scene: 'Scene', 'Q&A': 'Q&A', Guidance: 'Guidance' },
  async fetch() {
    const table = tables(await fetchText(feed)).find(t => t[0].map(c => c.text).join('|') === 'Model|Size|Score|Rubric components|Response type');
    const keys = ['EG','AC','TC','ACom','Scene','Q&A','Guidance'];
    if (!table || table[1].map(c => c.text).join('|') !== keys.join('|')) throw new Error('Missing VISTA score columns');
    let open = false;
    const rows = [];
    for (const c of table.slice(2)) {
      if (c.length === 1) { open = c[0].text.startsWith('Open-source'); continue; }
      const params = num(c[1].text), model = params == null ? c[0].text : c[0].text + ' ' + c[1].text;
      const values = c.slice(2).map(v => num(v.text));
      if (!model || values.length !== 8 || values.some(v => v == null)) throw new Error('Incomplete VISTA result');
      rows.push({ model, open, params, score: values[0]!, setting: 'Frames + text', metrics: Object.fromEntries(keys.map((k,i) => [k, values[i+1]!])) });
    }
    if (rows.length < 14) throw new Error('Missing VISTA models');
    return rows;
  },
};
export default board;
