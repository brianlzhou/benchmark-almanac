// Animal-Bench ranks video models by mean accuracy across 13 animal video tasks.
// The README chart gives the official Avg for Video-ChatGPT as 32.08. Its released counts yield 31.93.
// Read the published chart and check its digest before using the transcription.
import type { Leaderboard } from './types.ts';
import { checkedImageRows } from '../lib/boards/transcribed-image.ts';

const FEED = "https://github.com/user-attachments/assets/2057de50-19d2-43bf-9b4a-ff6dfd11d394";
const board: Leaderboard = {
  benchmark: "animal-bench",
  url: "https://github.com/PRIS-CV/Animal-Bench#evaluation-results",
  feed: FEED,
  terms: "The repository lists no license for its results files. FlagEval describes the source dataset as limited to research and noncommercial use. https://github.com/PRIS-CV/Animal-Bench GitHub publishes crawl rules in robots.txt.",
  aliases: {
    'Video-LLaVA': 'video-llava-7b',
  },
  parts: {"OE": "OE", "OR": "OR", "AR": "AR", "AS": "AS", "AP": "AP", "AL": "AL", "OC": "OC", "AC": "AC", "RS": "RS", "PM": "PM", "BM": "BM", "SA": "SA", "PD": "PD"},
  async fetch() {
    return checkedImageRows(FEED, '2b9bf2274841848fbbfc1fba88d5f1250472b3802fe3bf1e916d44e2afe67628', [
      {"model": "mPLUG-Owl", "score": 31.83, "metrics": {"OE": 42.2, "OR": 33.62, "AR": 27, "AS": 25.86, "AP": 25.48, "AL": 24.49, "OC": 24.14, "AC": 24.43, "RS": 22.38, "PM": 43.19, "BM": 39.31, "SA": 41.08, "PD": 40.56}},
      {"model": "VideoChat", "score": 37.87, "metrics": {"OE": 49.4, "OR": 51.61, "AR": 32.54, "AS": 32.76, "AP": 27.88, "AL": 23.25, "OC": 27.59, "AC": 25.51, "RS": 27.07, "PM": 48, "BM": 50.29, "SA": 48.87, "PD": 47.55}},
      {"model": "Video-ChatGPT", "score": 32.08, "metrics": {"OE": 44.65, "OR": 24.31, "AR": 24.28, "AS": 22.41, "AP": 24.52, "AL": 21.22, "OC": 24.71, "AC": 22.92, "RS": 25.69, "PM": 44.88, "BM": 43.35, "SA": 47.23, "PD": 46.85}},
      {"model": "Video-LLaMA", "score": 39.54, "metrics": {"OE": 49.2, "OR": 60.23, "AR": 35.34, "AS": 29.74, "AP": 29.81, "AL": 24.67, "OC": 26.44, "AC": 24.99, "RS": 35.08, "PM": 50.68, "BM": 47.98, "SA": 49.47, "PD": 50.35}},
      {"model": "Valley", "score": 31.58, "metrics": {"OE": 41.7, "OR": 25.06, "AR": 24.56, "AS": 27.16, "AP": 28.37, "AL": 25.45, "OC": 25.29, "AC": 23.78, "RS": 22.65, "PM": 40.28, "BM": 44.8, "SA": 42.96, "PD": 38.46}},
      {"model": "Chat-UniVi", "score": 37.64, "metrics": {"OE": 44.65, "OR": 43.25, "AR": 32.98, "AS": 33.19, "AP": 27.88, "AL": 24.14, "OC": 31.61, "AC": 24.34, "RS": 36.46, "PM": 49.7, "BM": 48.84, "SA": 48.18, "PD": 44.06}},
      {"model": "Video-LLaVA", "score": 34.54, "metrics": {"OE": 45.9, "OR": 40.55, "AR": 31.71, "AS": 25.86, "AP": 28.37, "AL": 24.32, "OC": 31.03, "AC": 22.49, "RS": 21.27, "PM": 45.37, "BM": 42.2, "SA": 44.16, "PD": 45.8}},
      {"model": "VideoChat2", "score": 53.66, "metrics": {"OE": 50, "OR": 86.75, "AR": 66.27, "AS": 54.31, "AP": 50, "AL": 21.22, "OC": 64.94, "AC": 29.16, "RS": 68.23, "PM": 52.44, "BM": 47.69, "SA": 52.42, "PD": 54.2}},
    ]);
  },
};
export default board;
