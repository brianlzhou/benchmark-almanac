// MarineEVT evaluates five kinds of reasoning about underwater videos. The results table reports their average and distinguishes training and tool configurations.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const FEED = "https://marineevt.hkustvgd.com/#results";
const board: Leaderboard = {
  benchmark: "marineevt",
  url: "https://marineevt.hkustvgd.com/#results",
  feed: FEED,
  terms: "The site lists no separate score license. The dataset card specifies MIT. The table contains 18 distinct model or method labels across 21 configurations. https://huggingface.co/datasets/AnTo2209/MarineEVT The robots URL returns HTML.",
  parts: { semantic: 'Semantic Reasoning', contextual: 'Contextual Reasoning', spatial: 'Spatial Reasoning', temporal: 'Temporal Reasoning', causal: 'Causal Reasoning' },
  async fetch() {
    const table = tables(await fetchText(FEED)).find(t => t[0].map(c => c.text).join('|') === 'Model|Training|Tools|SemR.|ConR.|SpaR.|TemR.|CasR.|Avg.');
    if (!table) throw new Error('Missing MarineEVT results');
    const rows = [];
    let group = '';
    for (const row of table.slice(1)) {
      if (row.length === 1) { group = row[0].text; continue; }
      const [name, training, tools, ...values] = row.map(c => c.text);
      if (name === 'Avg. across models') continue;
      const model = name.replace(/&dagger;/g, '†');
      if (!model || values.length !== 6 || values.some(v => !v || !Number.isFinite(Number(v)))) throw new Error('Incomplete MarineEVT result');
      const [semantic, contextual, spatial, temporal, causal, score] = values.map(Number);
      rows.push({ model, score, open: group.toLowerCase().includes('open-source'), setting: [training === '✓' ? 'Trained' : 'No training', tools === '✓' ? 'Tools' : 'No tools'].join(', '),
        metrics: { semantic, contextual, spatial, temporal, causal } });
    }
    if (rows.length < 21) throw new Error('Missing MarineEVT configurations');
    return rows;
  },
};
export default board;
