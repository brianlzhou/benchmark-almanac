// ExpertLongBench scores expert long-form documents by F1. Like the Space, average the eleven task scores in its JSON Lines file and round to one decimal.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = "https://huggingface.co/spaces/launch/ExpertLongBench/raw/main/src/models.json";
const board: Leaderboard = {
  benchmark: "expertlongbench",
  url: "https://huggingface.co/spaces/launch/ExpertLongBench",
  feed: FEED,
  terms: "The Space lists CC BY-NC 4.0. The default F1 table reads one JSON object per line and averages the 11 task scores. https://huggingface.co/spaces/launch/ExpertLongBench/raw/main/README.md Hugging Face robots.txt allows this file.",
  async fetch() {
    const keys = Array.from({ length: 11 }, (_, i) => 'T' + (i + 1));
    board.parts = Object.fromEntries(keys.map(k => [k, k]));
    const records = (await fetchText(FEED)).trim().split(/\r?\n/).map(line => JSON.parse(line) as Record<string, number | string>);
    if (records.length < 13) throw new Error('Missing ExpertLongBench models');
    return records.map(r => {
      const metrics: Record<string, number> = {};
      for (const key of keys) {
        const value = r[key];
        if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Missing ExpertLongBench ' + key);
        metrics[key] = value;
      }
      if (typeof r.Model !== 'string') throw new Error('Missing model name');
      return { model: r.Model, metrics, score: Math.round(10 * Object.values(metrics).reduce((a,b) => a + b, 0) / 11) / 10 };
    });
  },
};
export default board;
