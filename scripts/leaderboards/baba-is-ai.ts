// BALROG reports average progress across 40 Baba Is AI puzzles for language and vision models.
// The documentation tables give the mean and standard error over five seeds.
import type { Leaderboard } from './types.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://balrog-ai.github.io/docs/_sources/envs/babaisai.md.txt";

const board: Leaderboard = {
  benchmark: "baba-is-ai",
  url: "https://balrog-ai.github.io/docs/envs/babaisai.html",
  feed,
  terms: "The BALROG repository uses the MIT license. The hosted documentation credits the BALROG Team and gives no separate score terms. The host has no robots.txt.",
  host: 'BALROG',
  aliases: { 'llama-3.1-70B-it': 'llama-3-1-70b', 'llama-3.2-90B-it': 'llama-3-2-90b', 'llama-3.2-11B-it': 'llama-3-2-11b' },
  async fetch() {
    const source = await fetchText(feed);
    return ['LLM', 'VLM'].flatMap(setting => {
      const section = source.split('## ' + setting + ' results')[1]?.split(/\n## /)[0];
      const table = markdownTables(section ?? '')[0];
      if (table?.[0]?.join('|') !== 'Model|Average Progress (%)' || table.length <= (setting === 'LLM' ? 7 : 6))
        throw new Error('Missing Baba Is AI ' + setting + ' results');
      return table.slice(1).map(([model, value]) => {
        const pair = value.match(/^(\d+(?:\.\d+)?)\s*(?:&plusmn;|±)\s*(\d+(?:\.\d+)?)$/);
        if (!pair) throw new Error('Invalid average progress: ' + value);
        return { model, setting, score: Number(pair[1]), trials: 5, metrics: { standardError: Number(pair[2]) } };
      });
    });
  },
};
export default board;
