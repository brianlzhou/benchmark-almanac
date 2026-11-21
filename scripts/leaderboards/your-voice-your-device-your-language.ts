// Sartify publishes private and public word error rates for five Kiswahili ASR challenge teams. The official dataset card gives fractions, converted here to percentages.
import type { Leaderboard } from './types.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://huggingface.co/datasets/sartifyllc/kiswahili-asr-challenge-eval/raw/main/README.md";
const board: Leaderboard = {
  benchmark: 'your-voice-your-device-your-language',
  url: "https://zindi.africa/competitions/your-voice-your-device-your-language-challenge/leaderboard",
  feed,
  terms: "Zindi returns no robots file and Hugging Face allows crawling. The five published entries identify teams. Private WER is a fraction. The dataset card states CC BY-SA 4.0. https://huggingface.co/datasets/sartifyllc/kiswahili-asr-challenge-eval",
  async fetch() {
    const table = markdownTables(await fetchText(feed)).find(t => t[0].join('|') === 'Rank|User / Team|Affiliation|Public WER|Private WER|Submissions');
    if (!table || table.length < 6) throw new Error('Missing Kiswahili ASR standings');
    return table.slice(1).map(c => {
      const model = c[1], values = c.slice(3).map(v => v ? Number(v) : NaN);
      if (!model || values.length !== 3 || !values.every(Number.isFinite)) throw new Error('Invalid WER result');
      return { model, score: values[1] * 100, submitter: c[2] === '—' ? model : c[2], metrics: { publicWer: values[0] * 100, submissions: values[2] } };
    });
  },
};
export default board;
