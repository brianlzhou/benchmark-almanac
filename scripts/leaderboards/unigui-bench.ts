// UniGUI-Bench measures GUI agents across 11 process-level capability dimensions.
// This importer reads Table 4 of the paper and uses its reported average capability score as the headline.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = 'https://aclanthology.org/2026.findings-emnlp.2288.pdf';
const board: Leaderboard = {
  benchmark: 'unigui-bench', static: 'paper', url: 'https://aclanthology.org/2026.findings-emnlp.2288/', feed: FEED,
  terms: 'ACL Anthology papers are available under their stated publication terms. https://aclanthology.org/2026.findings-emnlp.2288/',
  parts: { elementGrounding: { name: 'Element Grounding' }, actionUnderstanding: { name: 'Action Understanding' }, pageUnderstanding: { name: 'Page Understanding' }, taskUnderstanding: { name: 'Task Understanding' }, actionPlanning: { name: 'Action Planning' }, actionExecution: { name: 'Action Execution' }, dynamicAdaptation: { name: 'Dynamic Adaptation' }, actionAnticipation: { name: 'Action Anticipation' }, taskProgress: { name: 'Task Progress Awareness' }, taskCompletion: { name: 'Task Completion Detection' }, internalState: { name: 'Internal State' }, intentReasoning: { name: 'Intent Reasoning' } },
  async fetch() {
    const paper = await pdfText(FEED);
    const table = paper.split(/Table 4: Process-level capability scores across 11 dimensions/)[1]?.split(/Table 5:/)[0];
    if (!table) throw new Error('Table 4 missing');
    const rows: LeaderboardRow[] = [];
    for (const line of table.split(/\r?\n/)) {
      const m = line.trim().match(/^(Seed-1\.8-VL|Kimi-K2\.5|Qwen3\.5-35B-A3B|GLM-5v-turbo|Qwen3-VL-32B|Gemini-3\.0-Flash|Seed-1\.5-VL|GLM-4\.6V-Flash|Gemini-2\.5-Flash|Qwen3-VL-8B|InternVL-3-38B|InternVL-3\.5-8B|InternVL3\.5-30B-A3B|InternVL-3-8B)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)$/);
      if (!m) continue;
      const values = m.slice(2).map(Number);
      const [score, ...parts] = values;
      const metrics: Record<string, number> = {};
      ['elementGrounding','actionUnderstanding','pageUnderstanding','taskUnderstanding','actionPlanning','actionExecution','dynamicAdaptation','actionAnticipation','taskProgress','taskCompletion','internalState','intentReasoning'].forEach((k, i) => metrics[k] = parts[i]);
      rows.push({ model: m[1], score, metrics });
    }
    if (rows.length !== 14) throw new Error(`Expected 14 Table 4 rows, found ${rows.length}`);
    return rows;
  },
};
export default board;
