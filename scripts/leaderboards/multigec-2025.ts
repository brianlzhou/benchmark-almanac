// The source reports no overall score. The headline is the plain mean of the 12 parts, computed by this importer.
// MultiGEC's first track ranks minimal grammatical edits by ERRANT F0.5. The second track ranks different outputs by Scribendi.
// For languages with several corpora the board publishes an Average table.
import type { Leaderboard } from './types.ts';
import { tables, text } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://spraakbanken.github.io/multigec-2025/results/test_results_minimal.html';
const systems = [
  { model: 'Gemma 2 9B', team: 'UAM-CSI' },
  { model: 'LLaMA 3', models: ['LLaMA 3', 'XLM-RoBERTa'], team: 'Lattice' },
  { model: 'Llama 3.1 8B Instruct', team: 'baseline' },
];
const board: Leaderboard = {
  benchmark: 'multigec-2025', url: feed, feed,
  terms: 'The organizers publish terms for MultiGEC. https://spraakbanken.github.io/multigec-2025/terms_of_use.html',
  aliases: { 'Llama 3.1 8B Instruct': 'llama-3-1-8b', 'Gemma 2 9B': 'gemma-2-9b' },
  async fetch() {
    const html = await fetchText(feed);
    const languages = [...html.matchAll(/<h2 id="([^"]+)">([^<]+)<\/h2>([\s\S]*?)(?=<h2 |\s*<\/article>)/g)];
    if (languages.length !== 12) throw new Error('Expected all twelve language groups');
    board.parts = Object.fromEntries(languages.map(([, key, name]) => [key, text(name)]));
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
