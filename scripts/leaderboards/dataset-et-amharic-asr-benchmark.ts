// Dataset.ET measures character error rate on Amharic speech. Its dataset card groups systems by training data and gives bootstrap intervals.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const feed = "https://huggingface.co/datasets/snapwre/amharic-asr-benchmark/resolve/main/README.md";

const board: Leaderboard = {
  benchmark: "dataset-et-amharic-asr-benchmark",
  url: "https://huggingface.co/datasets/snapwre/amharic-asr-benchmark",
  feed,
  terms: "Dataset.ET labels the benchmark CC BY 4.0. Preserve the three training-data categories. The JSON file contains character error rates for all 16 models. https://huggingface.co/datasets/snapwre/amharic-asr-benchmark The feed host publishes robots.txt at https://huggingface.co/robots.txt.",
  async fetch() {
    const source = await fetchText(feed);
    const rows: LeaderboardRow[] = [];
    for (const section of source.split(/^## /m)) {
      const heading = section.match(/^[1-3]\. (.+)/);
      if (!heading) continue;
      const table = markdownTables(section).find(([header]) =>
        ['model', 'CER', '95% CI', 'WER', 'speed'].every((name, i) => header[i] === name));
      if (!table) throw new Error('Missing score table for ' + heading[1]);
      for (const [model, cer, interval, wer, speed] of table.slice(1)) {
        const [low, high] = interval.replace(/[\[\]]/g, '').split(',').map(Number);
        const score = Number(cer) * 100;
        const metrics = { wer: Number(wer) * 100, speed: Number.parseFloat(speed) };
        if (![score, low, high, metrics.wer, metrics.speed].every(Number.isFinite)) throw new Error('Invalid row for ' + model);
        rows.push({ model, score, low: low * 100, high: high * 100, setting: heading[1], metrics, link: 'https://huggingface.co/' + model });
      }
    }
    if (rows.length < 16) throw new Error('Incomplete Amharic ASR results');
    return rows;
  },
};
export default board;
