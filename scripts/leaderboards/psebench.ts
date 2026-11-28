// PSEBench tests patient safety triage. Its paper reports verdict accuracy across all 5,074 cases,
// seven additional measures and verdict accuracy on complete, missing and uncertain cases.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
const feed = "https://arxiv.org/pdf/2606.05463";
const keys = ['Clause accuracy', 'Evidence citation F1', 'Boundary hit rate', 'Missing detection F1',
  'Missing slot identification F1', 'Uncertain detection F1', 'Reportable detection F1'];
const cases = ['Complete', 'Missing', 'Uncertain'];
const board: Leaderboard = {
  benchmark: 'psebench', static: 'paper',
  url: "https://labs.scale.com/papers/psebench",
  feed,
  terms: "Scale permits its public paper page in robots.txt and grants browser access for internal use. Results are credited to the paper authors.",
  parts: Object.fromEntries([...keys.map(k => [k, { name: k, group: 'Measure' }]), ...cases.map(k => [k, { name: k + ' cases', group: 'Case type' }])]),
  aliases: { 'Qwen3-235B': 'qwen3-235b-a22b', 'Mistral-Small-3.2 (24B)': 'mistral-small-3-2' },
  async fetch() {
    const paper = await pdfText(feed);
    const main = paper.match(/Model\s+Verdict Clause Evidence Boundary Missing Missing Slot Uncertain Reportable([\s\S]+?)Table 1: Overall performance/)?.[1];
    const splits = paper.match(/Model\s+Complete\s+Missing Uncertain([\s\S]+?)Table 2: Verdict accuracy/)?.[1];
    if (!main || !splits) throw new Error('Missing PSEBench results tables');
    const rows: LeaderboardRow[] = [];
    for (const line of main.split('\n')) {
      const match = line.trim().match(/^(.+?)\s+(\d+\.\d+(?:\s+\d+\.\d+){7})$/);
      if (!match) continue;
      const model = match[1], [score, ...values] = match[2].split(/\s+/).map(Number);
      const short = model.replace('Mistral-Small-3.2 (24B)', 'Mistral-Small-3.2').replace('HuatuoGPT-o1', 'HuatuoGPT');
      const split = splits.split('\n').map(l => l.trimStart()).find(l => l.startsWith(short) && /^\s+\d+\.\d/.test(l.slice(short.length)));
      const trio = split?.slice(short.length).trim().split(/\s+/).slice(0, 3).map(Number);
      if (trio?.length !== 3 || !trio.every(Number.isFinite)) throw new Error('Missing case scores for ' + model);
      rows.push({ model, score, metrics: Object.fromEntries([...keys, ...cases].map((k, i) => [k, [...values, ...trio][i]])) });
    }
    if (rows.length !== 15) throw new Error('Incomplete PSEBench model table');
    return rows;
  },
};
export default board;
