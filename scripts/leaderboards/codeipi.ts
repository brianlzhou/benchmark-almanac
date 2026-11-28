// CodeIPI tests coding agents against indirect prompt injection in issue and repository artifacts.
// The repository README reports composite accuracy for five named model runs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = 'https://raw.githubusercontent.com/UKGovernmentBEIS/inspect_evals/c2d3d5e1335c07fb8032bcfc7869e9437e635c4c/src/inspect_evals/ipi_coding_agent/README.md';

const VECTOR_KEYS: Record<string, string> = {
  code_comment: 'codeComment',
  config_file: 'configFile',
  issue_text: 'issueText',
  readme: 'readme',
};
const VECTOR_MODELS: Record<string, string> = {
  'Sonnet 4': 'anthropic/claude-sonnet-4-20250514',
  'Sonnet 4.6': 'anthropic/claude-sonnet-4-6-20250514',
  'GPT-4o': 'openai/gpt-4o-2024-11-20',
  'GPT-4.1': 'openai/gpt-4.1-2025-04-14',
};

const board: Leaderboard = {
  benchmark: 'codeipi',
  parts: {
    codeComment: { name: 'Code comments', group: 'Attack vector' },
    configFile: { name: 'Config file', group: 'Attack vector' },
    issueText: { name: 'Issue text', group: 'Attack vector' },
    readme: { name: 'README', group: 'Attack vector' },
  },
  stats: {
    irr: { name: 'Injection resistance rate (IRR)', unit: '%', better: 'higher' },
    tcr: { name: 'Task completion rate (TCR)', unit: '%', better: 'higher' },
    detection: { name: 'Injection detection rate', unit: '%', better: 'higher' },
  },
  url: 'https://github.com/UKGovernmentBEIS/inspect_evals/tree/c2d3d5e1335c07fb8032bcfc7869e9437e635c4c/src/inspect_evals/ipi_coding_agent',
  feed: FEED,
  terms: 'The repository is licensed under Apache 2.0. https://github.com/UKGovernmentBEIS/inspect_evals/blob/main/LICENSE',
  async fetch() {
    const all = markdownTables(await fetchText(FEED));
    const main = all.find((t) => t[0]?.join('|') === 'Model|Accuracy|IRR|TCR|Detection|FPR');
    if (!main) throw new Error('CodeIPI model table missing');
    const byModel = new Map<string, Record<string, number>>();
    const vec = all.find((t) => t[0]?.[0] === 'Vector' && t[0].includes('Sonnet 4') && t[0].includes('GPT-4.1'));
    if (vec) {
      const headers = vec[0];
      for (const r of vec.slice(1)) {
        const key = VECTOR_KEYS[r[0]];
        if (!key) continue;
        for (let i = 2; i < headers.length; i++) {
          const model = VECTOR_MODELS[headers[i]];
          const v = num(r[i]);
          if (model && v !== undefined) {
            const m = byModel.get(model) ?? {};
            m[key] = v;
            byModel.set(model, m);
          }
        }
      }
    }
    const rows: LeaderboardRow[] = [];
    for (const r of main.slice(1)) {
      const model = r[0]?.trim();
      const score = num(r[1]);
      if (!model || score === undefined) continue;
      const metrics: Record<string, number> = { ...(byModel.get(model) ?? {}) };
      const irr = num(r[2]);
      const tcr = num(r[3]);
      const det = num(r[4]);
      if (irr !== undefined) metrics.irr = irr;
      if (tcr !== undefined) metrics.tcr = tcr;
      if (det !== undefined) metrics.detection = det;
      rows.push({ model, score, metrics: Object.keys(metrics).length ? metrics : undefined });
    }
    return checked(rows, 5);
  },
};
export default board;
