// GigaSpeech tests English speech recognition. Lower test word error rate is better.
// The authors' README leaderboard lists models, toolkits and both development and test word error rates.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://raw.githubusercontent.com/SpeechColab/GigaSpeech/HEAD/README.md';
const board: Leaderboard = {
  benchmark: 'gigaspeech', url: 'https://github.com/SpeechColab/GigaSpeech#leaderboard', feed,
  terms: 'Apache License 2.0 at https://github.com/SpeechColab/GigaSpeech/blob/main/LICENSE.',
  parts: { devWER: { name: 'Development', better: 'lower' } },
  async fetch() {
    const section = (await fetchText(feed)).split('## Leaderboard')[1]?.split(/^## /m)[0];
    if (!section?.includes('**Dev/Test WER**')) throw new Error('Missing GigaSpeech leaderboard');
    function label(cell: string) {
      const name = cell.match(/^\[([^\]]+)\]\(/)?.[1];
      if (!name) throw new Error('Missing linked recipe or toolkit');
      return name.replace(/\s*<br\s*\/?\s*>\s*/gi, ' ');
    }
    const lines = section.split('\n').filter(line => line.startsWith('|') && !/^\|[:|]/.test(line));
    return checked(lines.slice(1).map(line => {
      const [team, toolkit, recipe, setting, checkpoint, wer] = line.trim().split('|').slice(1, -1).map(c => c.trim());
      const [dev, test] = wer.split('/').map(c => numberCell(c.trim()));
      return { model: label(recipe), harness: label(toolkit), setting, score: test, metrics: { devWER: dev },
        submitter: team.includes('<em>Baseline</em>') ? undefined : team, link: checkpoint.match(/\[model\]\(([^)]+)\)/)?.[1] };
    }), 9);
  },
};
export default board;
