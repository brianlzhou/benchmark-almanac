// evaldetectbench: whole-benchmark scores transcribed on 2026-11-08.
// Image: https://arxiv.org/html/2609.01611v1/x6.png
// The score is ensemble AUROC across evaluations and deployment transcripts, on a zero-to-one scale. Model-family labels without sizes remain unlisted.
// Two separate visual passes agreed. A changed SHA-256 requires a new transcription.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://arxiv.org/html/2609.01611v1/x6.png (transcribed 2026-11-08)";
import { checkedImageRows } from '../lib/boards/transcribed-h1.ts';
const IMAGE = "https://arxiv.org/html/2609.01611v1/x6.png";
const SHA256 = "8a3398b89270df73d9a403ca08854c85a9d56f2d98ba076a29cfd1236608fa41";
const ROWS: LeaderboardRow[] = [
  {
    "model": "Claude Haiku 4.5",
    "score": 0.758
  },
  {
    "model": "Claude Sonnet 4.6",
    "score": 0.878
  },
  {
    "model": "Claude Opus 4.6",
    "score": 0.892
  },
  {
    "model": "gpt-4.1",
    "score": 0.784
  },
  {
    "model": "gpt-5.1",
    "score": 0.802
  },
  {
    "model": "gpt-5.4",
    "score": 0.825
  },
  {
    "model": "Gemini 2.5 Pro (snapshot unspecified)",
    "score": 0.763
  },
  {
    "model": "Gemini 3.1 Pro",
    "score": 0.872
  },
  {
    "model": "DeepSeek V3.2",
    "score": 0.796
  },
  {
    "model": "glm-5.1",
    "score": 0.779
  },
  {
    "model": "Kimi K2.5",
    "score": 0.808
  },
  {
    "model": "Qwen3.5 (size unspecified)",
    "score": 0.811
  }
];
const board: Leaderboard = {
  benchmark: "evaldetectbench",
  url: "http://evaldetectbench.com/",
  feed: FEED,
  terms: "The authors publish this source publicly. Robots rules permit this path. Source attribution and licensing apply.",
  async fetch(): Promise<LeaderboardRow[]> {
    return checkedImageRows(IMAGE, SHA256, ROWS);
  },
};
export default board;
