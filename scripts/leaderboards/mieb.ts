// MIEB Multilingual: current default Mean(TaskType), scaled to the displayed 0-to-100 score.
// Only rows with a published whole-benchmark aggregate qualify. Task-type scores remain metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://mteb-leaderboard-backend.hf.space/v1/benchmarks/MIEB%28Multilingual%29/scores";
const board: Leaderboard = {
  benchmark: "mieb",
  parts: {
    ImageClassification: { name: 'Image classification', group: 'Task type' },
    DocumentUnderstanding: { name: 'Document understanding', group: 'Task type' },
    Any2AnyRetrieval: { name: 'Any to any retrieval', group: 'Task type' },
    ZeroShotClassification: { name: 'Zero shot classification', group: 'Task type' },
    VisionCentricQA: { name: 'Vision centric question answering', group: 'Task type' },
    Any2AnyMultilingualRetrieval: { name: 'Any to any multilingual retrieval', group: 'Task type' },
    ImageClustering: { name: 'Image clustering', group: 'Task type' },
    Compositionality: { name: 'Compositionality', group: 'Task type' },
    'VisualSTS(eng)': { name: 'Visual semantic textual similarity, English', group: 'Task type' },
    'VisualSTS(multi)': { name: 'Visual semantic textual similarity, multilingual', group: 'Task type' },
  },
  url: "https://mteb-leaderboard-backend.hf.space/v1/benchmarks/MIEB%28Multilingual%29/scores",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const d=await fetchJson<any>(FEED);
      return d.rows.filter((r:any)=>typeof r.meanTaskType==='number').map((r:any)=>({model:r.model.name.replace(/^[^/]+\//,''),score:r.meanTaskType*100,metrics:Object.fromEntries(Object.entries(r.scoresByTaskType).filter(([,v])=>typeof v==='number').map(([k,v])=>[k,(v as number)*100]))}));
    })();
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;
