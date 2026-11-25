// AutoAdvExBench evaluates models on 51 real-world image defenses. The README reports the percentage defeated.
// The same summary gives the defense count and the mean robust accuracy after each model's evaluation.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://raw.githubusercontent.com/ethz-spylab/AutoAdvExBench/HEAD/README.md';
const board: Leaderboard = {
  benchmark: 'autoadvexbench', url: 'https://github.com/ethz-spylab/AutoAdvExBench', feed,
  terms: 'Public results from the authors, hosted under GitHub’s terms. https://docs.github.com/en/site-policy/github-terms/github-terms-of-service',
  stats: {
    defensesDefeated: { name: 'Defenses defeated', unit: 'count' },
    meanRobustAccuracy: { name: 'Mean robust accuracy', unit: '%', better: 'higher' },
  },
  aliases: { 'Sonnet 3.7': 'claude-3-7-sonnet' },
  async fetch() {
    const text = (await fetchText(feed)).split('Summarized Briefly:')[1]?.split('You can view')[0];
    if (!text) throw new Error('Missing real-world defense summary');
    const rows: LeaderboardRow[] = [];
    for (const line of text.split('\n').filter(line => line.startsWith('- '))) {
      const match = /^- (.+?) attacks (\d+)% of defenses \((\d+) of (\d+)\).*?average robust accuracy to ([\d.]+)%\./.exec(line);
      if (!match) throw new Error('Changed defense result: ' + line);
      const [, label, rate, defeated, , accuracy] = match;
      const joint = label.endsWith(' (+o3)');
      const model = joint ? label.replace(' (+o3)', '') : label;
      rows.push({model, score: Number(rate), ...(joint ? { models: [model, 'o3'], setting: 'With o3' } : {}),
        metrics: { defensesDefeated: Number(defeated), meanRobustAccuracy: Number(accuracy) }});
    }
    return checked(rows, 6);
  },
};
export default board;
