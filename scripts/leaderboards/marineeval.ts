// MarineEval reports total accuracy across 2,000 marine image and document questions.
// The HTML results table also gives the seven task accuracies and their unweighted mean.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://marineeval.hkustvgd.com/";
const board: Leaderboard = {
  benchmark: "marineeval",
  url: "https://marineeval.hkustvgd.com/",
  feed,
  terms: "The dataset uses CC BY 4.0. I found no separate license for the HTML score table. The update date comes from the page header. The site's robots.txt publishes content signals.",
  parts: { behavior: 'Behavior and Trait Extraction', conservation: 'Conservation and Threat Analysis', document: 'Document Interpretation', hallucination: 'Hallucination Resistance', technology: 'Marine Technology Understanding', spatial: 'Spatial Reasoning', species: 'Species Comprehension' },
  stats: { mean: { name: 'Mean across tasks', unit: '%', better: 'higher' } },
  aliases: { 'InternVL-2.5': 'internvl2-5-4b', 'InternVL-2': 'internvl2-8b', 'InternVL-2.5 (26B)': 'internvl2-5-26b', 'InternVL-3': 'internvl3-38b', 'Claude-3.7-Sonnet-Vision': 'claude-3-7-sonnet' },
  async fetch() {
    const data = tables(await fetchText(feed)).find(t => t[0]?.map(c => c.text).join('|') === 'Model|# Params.|B&TE|C&TA|DI|HR|MTU|SR|SC|Avg.|Total');
    if (!data) throw new Error('Missing MarineEval results');
    const rows = [];
    let open = false;
    for (const cells of data.slice(1)) {
      const [model, size, ...scores] = cells.map(c => c.text);
      if (model === 'Human Performance') break;
      if (model.endsWith('source VLMs')) { open = model.startsWith('Open'); continue; }
      if (model === 'Avg. across models') continue;
      if (!model || scores.length !== 9 || scores.some(s => !s || !Number.isFinite(Number(s)))) throw new Error('Invalid MarineEval score');
      const [behavior, conservation, document, hallucination, technology, spatial, species, mean, score] = scores.map(Number);
      rows.push({ model, score, open, params: size.endsWith('B') ? parseFloat(size) : undefined,
        metrics: { behavior, conservation, document, hallucination, technology, spatial, species, mean } });
    }
    if (rows.length < 17) throw new Error('Missing MarineEval models');
    return rows;
  },
};
export default board;
