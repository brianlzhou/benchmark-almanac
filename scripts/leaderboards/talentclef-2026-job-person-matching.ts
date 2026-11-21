// TalentCLEF ranks job-person matching runs by average within-language MAP. Its results TSV includes language-pair scores, gender comparisons and run identifiers.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://talentclef.github.io/talentclef/results_task_a_2026/results_a.tsv";
const board: Leaderboard = {
  benchmark: 'talentclef-2026-job-person-matching',
  url: "https://talentclef.github.io/talentclef/docs/talentclef-2026/results/task_a_results/",
  feed,
  terms: "The host has no robots file. The organizers license the results pages under CC BY 4.0. https://talentclef.github.io/talentclef/docs/talentclef-2026/results/task_a_results/",
  parts: { 'MAP(en-en)': 'English to English', 'MAP(es-es)': 'Spanish to Spanish', 'MAP(en-es)': 'English to Spanish' },
  async fetch() {
    const [header, ...lines] = (await fetchText(feed)).trimEnd().split(/\r?\n/);
    const fields = header.split('\t'), headline = 'Avg.MAP(en,es)';
    const required = ['Team', 'run_ID', headline, 'MAP(en-en)', 'MAP(es-es)', 'Avg.RBO', 'Models'];
    if (!required.every(k => fields.includes(k)) || lines.length < 36) throw new Error('Missing TalentCLEF standings');
    return lines.map(line => {
      const c = line.split('\t'), cell = (key: string) => c[fields.indexOf(key)];
      const model = cell('Team'), setting = cell('run_ID'), score = cell(headline);
      if (!model || !setting || !score || !Number.isFinite(Number(score))) throw new Error('Invalid TalentCLEF run');
      const metrics: Record<string, number> = {};
      for (const k of fields.slice(fields.indexOf(headline) + 1, fields.indexOf('Avg.RBO') + 1)) {
        const value = cell(k);
        if (!value) continue;
        if (!Number.isFinite(Number(value))) throw new Error('Invalid TalentCLEF metric ' + k);
        metrics[k] = Number(value);
      }
      const models = cell('Models')?.split(';').map(s => s.trim()).filter(Boolean);
      return { model, submitter: model, setting, score: Number(score), models: models?.length > 1 ? models : undefined, metrics };
    });
  },
};
export default board;
