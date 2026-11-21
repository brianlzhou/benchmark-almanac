// AlephBench compares models on eleven Hebrew tasks. The authors' CSV gives the composite AlephBench score and each task score.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const FEED = "https://huggingface.co/datasets/HebArabNlpProject/AlephBench/raw/main/leaderboard.csv";
const tasks = ["MMLU", "ARC", "HellaSwag", "GSM8K", "COPA", "Hebrew-QA", "HebNLI", "Winograd", "Sentiment", "Trivia", "Translation"];

const board: Leaderboard = {
  benchmark: "alephbench",
  url: "https://huggingface.co/datasets/HebArabNlpProject/AlephBench#leaderboard",
  feed: FEED,
  terms: "The authors license the leaderboard under CC BY 4.0. Source tasks retain their individual licenses. https://huggingface.co/datasets/HebArabNlpProject/AlephBench Hugging Face allows crawling in robots.txt.",
  parts: Object.fromEntries(tasks.map((key) => [key, key])),
  async fetch() {
    const records = parseCsv(await fetchText(FEED));
    if (records.length < 6) throw new Error('Expected six AlephBench models');
    return records.map((r) => {
      const number = (column: string) => {
        const value = r[column];
        if (!value?.trim() || !Number.isFinite(Number(value))) throw new Error(`Invalid ${column} for ${r.model}`);
        return Number(value);
      };
      if (!r.model) throw new Error('Missing AlephBench model');
      return { model: r.model, score: number('AlephBench'), metrics: Object.fromEntries(tasks.map((key) => [key, number(key)])) };
    });
  },
};
export default board;
