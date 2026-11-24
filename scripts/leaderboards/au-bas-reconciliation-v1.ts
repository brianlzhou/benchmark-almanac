// Models reconcile Australian GST ledgers and identify bookkeeping faults.
// The environment README's Status table gives a weighted total of 60% BAS correctness and 40% fault audit F1.
import { execFileSync } from 'node:child_process';
import type { Leaderboard } from './types.ts';
import { fetchBytes, fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const slug = 'afzal0/au-bas-reconciliation-v1';
const feed = 'https://api.primeintellect.ai/api/v1/environmentshub/' + slug + '/@latest';
function value(text: string, pattern: RegExp) {
  const match = text.match(pattern);
  if (!match) throw new Error('Missing BAS result field: ' + pattern);
  return Number(match[1]);
}
const board: Leaderboard = {
  benchmark: 'au-bas-reconciliation-v1',
  url: 'https://app.primeintellect.ai/dashboard/environments/' + slug,
  feed,
  terms: 'The author publishes the results through Prime Intellect. https://www.primeintellect.ai/terms-of-service',
  parts: { bas: 'BAS correctness', audit: 'Fault audit F1' },
  stats: {
    precision: { name: 'Fault precision', unit: 'score', better: 'higher' },
    recall: { name: 'Fault recall', unit: 'score', better: 'higher' },
    flagged: { name: 'Mean pairs flagged', unit: 'count' },
    parsed: { name: 'Fraction parsed', unit: 'score', better: 'higher' },
    labels: { name: 'BAS label accuracy', unit: 'score', better: 'higher' },
    completed: { name: 'Completed tasks', unit: 'count' },
    scheduled: { name: 'Scheduled tasks', unit: 'count' },
  },
  async fetch() {
    const { data } = await fetchJson<{ data: { package_url: string } }>(feed);
    const archive = Buffer.from(await fetchBytes(data.package_url));
    const readme = execFileSync('tar', ['-xzOf', '-', 'README.md'], { input: archive, encoding: 'utf8' });
    const status = readme.split('## Status')[1]?.split(/\n## /)[0];
    if (!status?.includes('| Check | Result |')) throw new Error('Missing BAS Status table');
    const rows = status.split('\n').filter(line => line.startsWith('| Eval ')).map(line => {
      const model = line.match(/^\| Eval [^\x60]*\x60([^\x60]+)\x60/)?.[1];
      const date = line.match(/\d{4}-\d{2}-\d{2}/)?.[0];
      if (!model || !date) throw new Error('Missing BAS model or date');
      const metrics: Record<string, number> = {
        bas: value(line, /\x60bas_correct\x60 ([\d.]+)/), audit: value(line, /\x60fault_audit\x60 ([\d.]+)/),
        precision: value(line, /(?:\x60fault_precision\x60|precision) ([\d.]+)/),
        recall: value(line, /(?:\x60fault_recall\x60|recall) ([\d.]+)/),
        flagged: value(line, /\x60num_flagged\x60 ([\d.]+)/), parsed: value(line, /\x60parsed\x60 ([\d.]+)/),
        completed: value(line, /(\d+)\/\d+ completed/), scheduled: value(line, /\d+\/(\d+) completed/),
      };
      if (line.includes('\x60bas_label_accuracy\x60')) metrics.labels = value(line, /\x60bas_label_accuracy\x60 ([\d.]+)/);
      return { model, date, harness: 'null', setting: date === '2026-09-11' ? 'Original prompt' : 'Revised prompt',
        score: value(line, /weighted total (?:≈ )?(\d+\.\d+)/), metrics };
    });
    return checked(rows, 5);
  },
};
export default board;
