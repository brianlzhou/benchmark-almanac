// MLLM-Jailbreak-Bench measures adversarial attack success rate (ASR), refusal quality, and calibration error on multimodal LLMs.
// The repository README publishes baseline results as 0 to 1 proportions, converted here to percentages (0 to 100).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://raw.githubusercontent.com/ziyuwowo/mllm-jailbreak-bench/main/README.md';

const board: Leaderboard = {
  benchmark: 'mllm-jailbreak-bench',
  static: 'paper',
  url: 'https://github.com/ziyuwowo/mllm-jailbreak-bench',
  feed,
  terms: 'Repository README in ziyuwowo/mllm-jailbreak-bench, licensed BSD-3-Clause.',
  aliases: {
    'GPT-4V (Apr-2024)': 'gpt-4v',
    'Qwen2-VL-7B': 'qwen2-vl-7b-instruct',
    'LLaVA-1.5-7B': 'llava-v1-5-7b',
    'LLaVA-1.6-13B': 'llava-v1-6-vicuna-13b',
  },
  stats: {
    refusalQuality: { name: 'Refusal quality', unit: '%', better: 'higher', note: 'Share of refusals that gave a substantive refusal rather than a generic one.' },
    calibrationError: { name: 'Calibration error', unit: '%', better: 'lower', note: 'Difference in attack success rate between adversarial and clean baseline prompts.' },
  },
  async fetch() {
    const md = await fetchText(feed);
    const lines = md.split(/\r?\n/);
    const start = lines.findIndex((l) => /\|\s*Model\s*\|\s*ASR \(avg\)\s*\|/i.test(l));
    if (start < 0) throw new Error('Missing MLLM-Jailbreak-Bench results table in README');
    const rows: LeaderboardRow[] = [];
    for (const line of lines.slice(start + 2)) {
      if (!line.trim().startsWith('|')) break;
      const cells = line.split('|').slice(1, -1).map((c) => c.trim());
      if (cells.length < 4) continue;
      const [model, asrS, refS, calS] = cells;
      const asr = Number(asrS);
      const ref = Number(refS);
      const cal = Number(calS);
      if (!model || !Number.isFinite(asr)) continue;
      rows.push({
        model,
        score: Number((asr * 100).toFixed(2)),
        metrics: {
          refusalQuality: Number((ref * 100).toFixed(2)),
          calibrationError: Number((cal * 100).toFixed(2)),
        },
      });
    }
    if (rows.length < 5) throw new Error(`Expected 5 MLLM-Jailbreak-Bench rows, got ${rows.length}`);
    return rows;
  },
};

export default board;
