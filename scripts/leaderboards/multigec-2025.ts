// The source reports no overall score. The headline is the plain mean of the 12 parts, computed by this importer.
// MultiGEC's first track ranks minimal grammatical edits by ERRANT F0.5. The second track ranks different outputs by Scribendi.
// For languages with several corpora the board publishes an Average table.
import type { BoardStat, Leaderboard } from './types.ts';
import { tables, text } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://spraakbanken.github.io/multigec-2025/results/test_results_minimal.html';
const systems = [
  { model: 'Gemma 2 9B', team: 'UAM-CSI' },
  { model: 'LLaMA 3', models: ['LLaMA 3', 'XLM-RoBERTa'], team: 'Lattice' },
  { model: 'Llama 3.1 8B Instruct', team: 'baseline' },
];
const languageNames: Record<string, string> = { czech: 'Czech', english: 'English', estonian: 'Estonian', german: 'German', greek: 'Greek', icelandic: 'Icelandic', italian: 'Italian', latvian: 'Latvian', russian: 'Russian', slovene: 'Slovene', swedish: 'Swedish', ukrainian: 'Ukrainian' };
const metricStats: Record<string, BoardStat> = Object.fromEntries(Object.entries(languageNames).flatMap(([key, language]) => [
  [key + 'Gleu', { name: language + ' generalized language evaluation understanding', unit: '%', better: 'higher' as const }],
  [key + 'Precision', { name: language + ' precision', unit: '%', better: 'higher' }],
  [key + 'Recall', { name: language + ' recall', unit: '%', better: 'higher' }],
  [key + 'Scribendi', { name: language + ' Scribendi score', unit: 'score', better: 'higher' }],
]));
const board: Leaderboard = {
  benchmark: 'multigec-2025', url: feed, feed,
  terms: 'The organizers publish terms for MultiGEC. https://spraakbanken.github.io/multigec-2025/terms_of_use.html',
  aliases: { 'Llama 3.1 8B Instruct': 'llama-3-1-8b', 'Gemma 2 9B': 'gemma-2-9b' },
  parts: Object.fromEntries(Object.entries(languageNames).map(([key, name]) => [key, { name, group: 'Language' }])),
  stats: metricStats,
  async fetch() {
    const html = await fetchText(feed);
    const languages = [...html.matchAll(/<h2 id="([^"]+)">([^<]+)<\/h2>([\s\S]*?)(?=<h2 |\s*<\/article>)/g)];
    if (languages.length !== 12) throw new Error('Expected all twelve language groups');
    return checked(systems.map(({ team, ...identity }) => {
      const metrics: Record<string, number> = {};
      let sum = 0;
      for (const [, key, , section] of languages) {
        const groups = section.split(/<h3[^>]*>Average<\/h3>/);
        const data = tables(groups.at(-1)!);
        if (data.length !== 1 || data[0][0].map(c => c.text).join('|') !== 'Rank|Team|GLEU|Precision|Recall|F0.5|Scribendi') throw new Error('Missing language ranking ' + key);
        const row = data[0].find(r => r[1]?.text === team);
        if (!row || row.length !== 7) throw new Error('Missing ' + team + ' result for ' + key);
        ['Gleu', 'Precision', 'Recall', '', 'Scribendi'].forEach((suffix, j) => {
          const value = row[j + 2].text;
          if (!/^-?\d+(?:\.\d+)?$/.test(value)) throw new Error('Invalid MultiGEC result');
          metrics[key + suffix] = Number(value);
        });
        sum += metrics[key];
      }
      return { ...identity, submitter: team === 'baseline' ? 'Organizers' : team, score: sum / 12, metrics };
    }), 3);
  },
};
export default board;
