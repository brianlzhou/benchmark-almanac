// Qwen tests tool use in smart cockpit scenarios. The short suite scores whole cases and the long suite scores turns.
// The maintained accuracy.md reports both suites for the same five systems.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const repo = 'https://github.com/QwenAudio/qwen-audio-agent';
const path = 'examples/smart-cockpit/bench/results/accuracy.md';
const feed = 'https://raw.githubusercontent.com/QwenAudio/qwen-audio-agent/main/' + path;
function rate(cell: string) {
  const match = cell?.match(/^([\d.]+)% \((\d+)\/(\d+)\)$/);
  if (!match || Math.abs(Number(match[1]) - 100 * Number(match[2]) / Number(match[3])) > 0.005)
    throw new Error('Invalid pass rate: ' + cell);
  return Number(match[1]);
}

const board: Leaderboard = {
  benchmark: 'smart-cockpit-benchmark-qwen', url: repo + '/blob/main/' + path, feed,
  terms: 'Apache License 2.0. ' + repo + '/blob/main/LICENSE',
  headline: 'The headline is the percentage of short cases that passed all checks.',
  parts: { Vehicle: 'Vehicle', Music: 'Music', Navigation: 'Navigation', Weather: 'Weather',
    long: 'Overall turn accuracy', tool: 'Tool-required turn pass', noTool: 'No-tool turn correctness' },
  async fetch() {
    const tables = markdownTables(await fetchText(feed));
    const short = tables.find(t => t[0][0] === 'Domain' && t[0][1] === 'Test cases');
    const long = tables.find(t => t[0].join('|') === 'Subject|Overall turn accuracy|Tool-required turn pass|No-tool turn correctness');
    if (!short || !long) throw new Error('Missing cockpit results tables');
    const domains = new Map(short.slice(1).map(row => [row[0], row]));
    return checked(short[0].slice(2).map((subject, i) => {
      const turns = long.find(row => row[0] === subject);
      if (!turns) throw new Error('Missing long dialogue results for ' + subject);
      const metrics: Record<string, number> = { long: rate(turns[1]), tool: rate(turns[2]), noTool: rate(turns[3]) };
      for (const key of ['Vehicle', 'Music', 'Navigation', 'Weather']) metrics[key] = rate(domains.get(key)?.[i+2] ?? '');
      return { model: subject.startsWith('Realtime-plus') ? 'qwen-audio-3.0-realtime-plus' : subject.replace(/^Text /, ''),
        harness: subject.endsWith('+ Harness') ? 'Gateway' : undefined,
        setting: subject.startsWith('Text ') ? 'Text' : undefined, metrics, score: rate(domains.get('Overall')?.[i+2] ?? '') };
    }), 5);
  },
};
export default board;
