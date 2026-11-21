// MonitorBench measures how often an observer detects the factor driving a model's answer.
// Tables 2, 4 and 5 give standard monitorability scores. Tables 3, 6 and 7 report percentage-point changes under the two stress tests.
// Add those changes to the published scores. Both inputs are rounded to one decimal place.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const feed = 'https://proceedings.colm.cc/paper_files/paper/2026/file/32ebb6b560ee58abbdae834e5f37cb5d-Paper-Conference.pdf';
const models = ['Qwen3-14B', 'GPT-OSS-120B', 'Qwen3-235B-A22B', 'GPT-5-mini', 'GPT-5', 'Gemini-3-Flash', 'Claude Haiku 4.5', 'Claude Sonnet 4.5'];
const groups = {
  'Cue (Condition)': ['Health', 'Knowledge', 'Law Judgment', 'Preference'],
  'Cue (Answer)': ['Health', 'Mathematics', 'Logic'],
  'Goal (Sandbag)': ['Safety', 'Mathematics', 'Science', 'Engineering'],
  'Goal (Deception)': ['Real-world Case'],
  'Dual Objectives': ['Steganography', 'Summarization', 'Coding', 'Agent Malicious', 'Agent Benign'],
  'Impossible Tasks': ['Coding'], 'Solution Process': ['Multi-step Update'],
};
const parts = Object.fromEntries(Object.entries(groups).flatMap(([group, tasks]) =>
  tasks.map(name => [group + ': ' + name, { group, name }])));
const fields = [...Object.keys(parts), 'Avg. over tasks'];
function scores(paper: string, n: number, width: number) {
  const body = paper.split('Table ' + n + ': Monitorability score')[1];
  if (!body) throw new Error('Missing MonitorBench table ' + n);
  const end = body.match(/Avg\. over tasks[^\n]+/);
  if (!end) throw new Error('Missing overall row');
  const parsed = body.slice(0, end.index! + end[0].length).split('\n').flatMap(l => {
    const match = l.match(/^\s*(.*?)\s+((?:(?:–|-?\d+\.\d+)\s+)*(?:–|-?\d+\.\d+))\s*$/);
    if (!match || !match[1]) return [];
    const values = match[2].trim().split(/\s+/);
    if (values.length !== width) return [];
    return [{ label: match[1].trim(), values }];
  });
  if (parsed.length !== fields.length || parsed.some((r, i) => !r.label.endsWith(fields[i].split(': ').at(-1)!))) {
    throw new Error('Changed task rows in Table ' + n);
  }
  return parsed;
}
const board: Leaderboard = {
  benchmark: 'monitorbench', url: feed, feed, static: 'paper', parts,
  terms: 'COLM publishes this author manuscript at https://proceedings.colm.cc/paper_files/paper/2026/hash/32ebb6b560ee58abbdae834e5f37cb5d-Abstract-Conference.html.',
  async fetch() {
    const paper = await pdfText(feed);
    const rows: LeaderboardRow[] = [];
    for (const [scope, baseTable, deltaTable] of [['CoT-only', 2, 3], ['All-messages', 4, 6], ['Action-only', 5, 7]] as const) {
      const base = scores(paper, baseTable, 9);
      const deltas = scores(paper, deltaTable, 18);
      for (const [i, model] of models.entries()) {
        for (const [s, stress] of ['Standard', 'Direct Concealment', 'Monitor-aware Evasion'].entries()) {
          const values: Record<string, number> = {};
          fields.forEach((key, j) => {
            const baseline = base[j].values[i];
            const delta = s ? deltas[j].values[2 * i + s - 1] : '0';
            if (baseline !== '–' && delta !== '–') values[key] = Math.round((Number(baseline) + Number(delta)) * 10) / 10;
          });
          const score = values['Avg. over tasks'];
          delete values['Avg. over tasks'];
          rows.push({ model, score, setting: scope + ', ' + stress, metrics: values });
        }
      }
    }
    return checked(rows, 72);
  },
};
export default board;
