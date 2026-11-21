// The source reports no overall score. The headline is the plain mean of the 5 parts, computed by this importer.
// SWiM measures question-answering accuracy as document depth or distractor load changes.
// We read the story_forum chart twice, checking marker heights against line segments on the grid of 29 questions.
// The repository's tasks/data_cosmostory.json contains the 29 questions. A hash guards the chart transcription.
// The final Claude Opus depth marker is obscured, so only its distractor experiment is included.
import type { Leaderboard } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/snorkel-ai/long-context-eval/main/images/lcm_test.png';
const data: [string, number[] | null, number[]][] = [
  ['claude-2.1', [16,11,15,14,28], [27,13,14,12,11]],
  ['claude-3-opus-20240229', null, [28,22,26,26,23]],
  ['gemini-1.5-pro-preview-0409 [April 2024 snapshot]', [28,27,25,27,28], [27,28,27,27,28]],
  ['gpt-3.5-turbo-16k', [22,18,21,25,28], [28,26,21,22,22]],
  ['gpt-3.5-turbo', [28,24,27,28,29], [29,29,29,28,27]],
  ['gpt-4-0125-preview', [23,16,26,25,29], [29,23,25,23,20]],
  ['gpt-4-turbo-2024-04-09', [25,18,22,26,29], [29,28,24,25,21]],
  ['mistralai/Mixtral-8x7B-Instruct-v0.1', [28,29,26,27,27], [28,28,28,28,29]],
];
const board: Leaderboard = {
  benchmark: 'swim-snorkel', feed, url: 'https://github.com/snorkel-ai/long-context-eval#experiments-and-results',
  terms: 'The authors publish the chart in their public repository under GitHub terms. https://docs.github.com/en/site-policy/github-terms/github-terms-of-service',
  aliases: {'claude-3-opus-20240229': 'claude-3-opus', 'gpt-4-turbo-2024-04-09': 'gpt-4-turbo-apr-2024'},
  headline: 'The authors report accuracy at five levels of document depth or distractor load, so this is their plain mean within each experiment.',
  parts: Object.fromEntries([0,25,50,75,100].map(level => ['level' + level, level + '%'])),
  async fetch() {
    const rows = data.flatMap(([model, depth, load]) => [depth, load].flatMap((counts, index) => {
      if (!counts) return [];
      const metrics = Object.fromEntries(counts.map((count, i) => ['level' + i * 25, count * 100 / 29]));
      return [{model, setting: index === 0 ? 'Answer document depth' : 'Context window used with distractors',
        score: counts.reduce((sum, count) => sum + count, 0) * 100 / (5 * 29), metrics}];
    }));
    return checked(await chartRows(feed, '4bfb2e9d677c365723561d55ed44293f41fee5c086ac499e9e4fbcaf7a1b79af', rows), 15);
  },
};
export default board;
