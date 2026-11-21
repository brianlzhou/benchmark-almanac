// NarrativeBench measures whether models include, exclude and recover news narratives across languages.
// The main benchmark's first measure is narrative inclusion F1 in percent. Other measures include recall,
// language gaps and violation counts. Table 1 identifies the parenthesized values as standard errors.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://isle-dev.github.io/Narrative-Bench-NeurIPS-2026/';
const feed = url + 'data/paper-results.json';
type Source = { columns: { label: string, description: string, task: string | null }[], rows: { id: string, name: string,
  cells: { value: number | null, display: string }[], counts?: Record<string, number> }[] };
const keys = ['NI', 'NE', 'MNI', 'BP', 'DP', 'recallGap', 'queryGap', 'targetGap', 'bpOmission', 'dpOmission', 'violations'];
const board: Leaderboard = {
  benchmark: 'narrativebench', url, feed,
  terms: 'The authors publish the score matrix and source-specific licenses. https://github.com/isle-dev/Narrative-Bench-NeurIPS-2026',
  aliases: { "Command A (03-2025)": "cohere-command-a", "Qwen3.5 0.8B IT": "qwen3-5-0-8b", "Qwen3.5 9B IT": "qwen3-5-9b" },
  parts: { NI: { name: 'Narrative inclusion', unit: '%' }, NE: { name: 'Narrative exclusion', unit: '%' }, MNI: { name: 'Multilingual narrative inclusion', unit: '%' }, BP: { name: 'Background passage recall', unit: '%' }, DP: { name: 'Document passage recall', unit: '%' } },
  stats: { recallGap: { name: 'Recall gap', unit: 'score', better: 'lower' }, queryGap: { name: 'Query gap', unit: 'score', better: 'lower' }, targetGap: { name: 'Target gap', unit: 'score', better: 'lower' }, bpOmission: { name: 'Background passage omission', unit: '%', better: 'lower' }, dpOmission: { name: 'Document passage omission', unit: '%', better: 'lower' }, violations: { name: 'Language violations', unit: 'count', better: 'lower' }, NICases: { name: 'Narrative inclusion cases', unit: 'count' }, NECases: { name: 'Narrative exclusion cases', unit: 'count' }, MNICases: { name: 'Multilingual narrative inclusion cases', unit: 'count' }, BPCases: { name: 'Background passage cases', unit: 'count' }, DPCases: { name: 'Document passage cases', unit: 'count' } },
  async fetch() {
    const { columns, rows } = await fetchJson<Source>(feed);
    if (columns.map(c => c.label).join() !== 'NI F1,NE F1,MNI recall,BP recall,DP recall,Abs. recall gap,Query gap,Target gap,BP omit.,DP omit.,LVol')
      throw new Error('NarrativeBench measures changed');
    board.parts = Object.fromEntries(columns.slice(0, 5).map((c, i) => [keys[i], { name: c.description, unit: '%' }]));
    const result = rows.map(row => {
      if (row.cells.length !== keys.length || row.cells[0].value == null) throw new Error('Missing NarrativeBench scores');
      const metrics: Record<string, number> = {};
      row.cells.forEach((cell, i) => {
        if (cell.value === null) return;
        if (!Number.isFinite(cell.value)) throw new Error('Invalid score');
        metrics[keys[i]] = cell.value;
        const se = cell.display.match(/\(([\d.]+)\)/);
        if (se) metrics[i === 0 ? 'stderr' : keys[i] + 'Stderr'] = Number(se[1]);
      });
      for (const [task, count] of Object.entries(row.counts ?? {})) metrics[task+'Cases'] = count;
      const suffix = row.name.match(/ \((low|medium|high|xhigh)(?:, (\d+K))?\)$/);
      const setting = suffix?.[0].slice(2, -1) ?? (row.id.endsWith('-off') ? 'Reasoning disabled' : undefined);
      return { model: suffix ? row.name.slice(0, suffix.index) : row.name, setting, score: metrics.NI, metrics };
    });
    checked(result.map(row => ({ ...row })), 21);
    return result;
  },
};
export default board;
