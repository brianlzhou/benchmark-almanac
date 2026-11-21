// The source reports no overall score. The headline is the plain mean of the 9 parts, computed by this importer.
// CircuitSense tests circuit perception, design and analysis. The project site gives three perception and three design accuracies,
// two curated analysis accuracies and one synthetic analysis accuracy. Difficulty-level results remain separate metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://circuitsense-benchmark.github.io/';
const parts: Record<string, string> = {};
for (const [key, name] of Object.entries({
  PerceptionComponentDetec: 'Perception: Component detection',
  PerceptionConnectionIdent: 'Perception: Connection identification',
  PerceptionFunctionClass: 'Perception: Function classification',
  DesignSchematiclevel: 'Design: Schematic-level accuracy',
  DesignBlocklevel: 'Design: Block-level accuracy',
  DesignHierarchicalDesign: 'Design: Hierarchical design accuracy',
  CuratedanalysisMultipleChoiceFormatLevel0Resistor: 'Curated analysis: Multiple-choice format, level 0 resistor',
  CuratedanalysisMultipleChoiceFormatLevel1RLC: 'Curated analysis: Multiple-choice format, level 1 RLC',
  CuratedanalysisMultipleChoiceFormatLevel2SmallSignal: 'Curated analysis: Multiple-choice format, level 2 small signal',
  CuratedanalysisMultipleChoiceFormatLevel3Transistor: 'Curated analysis: Multiple-choice format, level 3 transistor',
  CuratedanalysisMultipleChoiceFormatLevel4Block: 'Curated analysis: Multiple-choice format, level 4 block',
  CuratedanalysisMultipleChoiceFormatOverallAccuracy: 'Curated analysis: Multiple-choice format, overall accuracy',
  CuratedanalysisOpenendedformatLevel0Resistor: 'Curated analysis: Open-ended format, level 0 resistor',
  CuratedanalysisOpenendedformatLevel1RLC: 'Curated analysis: Open-ended format, level 1 RLC',
  CuratedanalysisOpenendedformatLevel2SmallSignal: 'Curated analysis: Open-ended format, level 2 small signal',
  CuratedanalysisOpenendedformatLevel3Transistor: 'Curated analysis: Open-ended format, level 3 transistor',
  CuratedanalysisOpenendedformatLevel4Block: 'Curated analysis: Open-ended format, level 4 block',
  CuratedanalysisOpenendedformatOverallAccuracy: 'Curated analysis: Open-ended format, overall accuracy',
  SyntheticanalysisLevel0Resistor: 'Synthetic analysis: Level 0 resistor',
  SyntheticanalysisLevel1RLC: 'Synthetic analysis: Level 1 RLC',
  SyntheticanalysisLevel2SmallSignal: 'Synthetic analysis: Level 2 small signal',
  SyntheticanalysisLevel4Block: 'Synthetic analysis: Level 4 block',
  SyntheticanalysisLevel5System: 'Synthetic analysis: Level 5 system',
  SyntheticanalysisOverall: 'Synthetic analysis: Overall accuracy',
})) parts[key] = name;
const groups = ['Perception', 'Design', 'Curated analysis', 'Synthetic analysis'];
const board: Leaderboard = {
  benchmark: 'circuitsense', url: feed, feed, parts,
  terms: 'The authors publish their results on GitHub Pages. https://github.com/xz-group/CircuitSense',
  headline: 'The headline is the plain mean of nine reported accuracies across perception, design and analysis.',
  aliases: { 'GPT-4o (snapshot unspecified)': 'gpt-4o-aug-2024', 'Gemini-2.5-Pro (snapshot unspecified)': 'gemini-2-5-pro-jun-2025',
    'Qwen2.5-VL-72B-Instruct': 'qwen2-5-vl-72b' },
  async fetch() {
    const html = await fetchText(feed);
    const grids = tables(html).map(t => t.map(r => r.map(c => c.text)));
    const rows = new Map<string, LeaderboardRow>();
    const primary = new Set<string>();
    const names: Record<string,string> = { 'InternVL3-72B': 'InternVL3-78B', 'Qwen2.5-VL': 'Qwen2.5-VL-72B-Instruct', 'Qwen2.5-VL-72b-instruct': 'Qwen2.5-VL-72B-Instruct' };
    // Appendix A.5 identifies the single evaluated InternVL and Qwen checkpoint for all tasks.
    for (const [i, marker] of ['Component Detec. (%)','Schematic- level (%)','Overall Accuracy','Overall'].entries()) {
      const t = grids.find(t => t[0].includes(marker));
      if (!t) throw new Error('Missing ' + groups[i] + ' table');
      let group = groups[i];
      for (const r of t.slice(1)) {
        if (r.length === 1) { group = groups[i] + ' ' + r[0].replace(/ \(%\)$/, ''); continue; }
        if (r.length !== t[0].length) throw new Error('Incomplete ' + group + ' row');
        const model = names[r[0]] ?? r[0];
        const row = rows.get(model) ?? { model, score: 0, metrics: {} as Record<string, number> };
        for (let j=1; j<r.length; j++) {
          const label = group + ': ' + t[0][j].replace(/ \(%\)$/, '').replace(/- /g, '-');
          const key = label.replace(/[^A-Za-z0-9]/g, '');
          if (!/^\d+(\.\d+)?$/.test(r[j])) throw new Error('Invalid ' + label);
          row.metrics![key] = Number(r[j]);
          parts[key] = label;
          if (i < 2 || j === r.length - 1) primary.add(key);
        }
        rows.set(model,row);
      }
    }
    if (primary.size !== 9) throw new Error('Expected nine accuracy columns');
    const complete = [...rows.values()].filter(r => [...primary].every(k => r.metrics![k] !== undefined));
    for (const r of complete) r.score = [...primary].reduce((s,k) => s + r.metrics![k],0) / primary.size;
    return checked(complete, 6);
  },
};
export default board;
