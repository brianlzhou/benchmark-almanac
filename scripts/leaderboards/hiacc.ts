// Srota-Conv reports whole-test word error rate on 1,036 HiACC clips. Its model card compares the base and fine-tuned models and reports adult and child results.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { num } from '../lib/html.ts';

const feed = "https://huggingface.co/moorlee/qwen3-asr-0.6b-hinglish-hiacc-v1/raw/main/README.md";

const board: Leaderboard = {
  benchmark: "hiacc",
  url: "https://huggingface.co/moorlee/qwen3-asr-0.6b-hinglish-hiacc-v1",
  feed,
  terms: "The Srota-Conv card declares Apache 2.0 and Hugging Face allows the card in robots.txt.",
  host: 'Srota-Conv',
  aliases: { 'Base Qwen3-ASR-0.6B': 'qwen3-asr-0-6b' },
  parts: { adult: 'Adult', children: 'Children' },
  async fetch() {
    const t = markdownTables(await fetchText(feed)).find(t => t[0]?.[0] === 'HiACC cohort');
    if (!t || t[0][2] !== 'Base Qwen3-ASR-0.6B' || t[0][3] !== 'Srota-Conv') throw new Error('Missing HiACC model columns');
    return t[0].slice(2, 4).map((model, i) => {
      const get = (name: string) => num(t.find(r => r[0] === name)?.[i + 2]);
      const score = get('Overall'), adult = get('Adult'), children = get('Children');
      if (score == null || adult == null || children == null) throw new Error('Missing HiACC result');
      return { model, score, metrics: { adult, children } };
    });
  },
};

export default board;
