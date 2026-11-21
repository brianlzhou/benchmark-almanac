// Lech Mazur rates round-trip translation on a ten-point scale. The score file gives five judgments per item and the chart draws three standard errors around the overall mean.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';

const feed = "https://raw.githubusercontent.com/lechmazur/translation/HEAD/data/judge_scores_multi.csv";

const board: Leaderboard = {
  benchmark: "translation-lech-mazur",
  url: "https://github.com/lechmazur/translation",
  feed,
  terms: "The publisher displays results at https://github.com/lechmazur/translation. I could not verify reuse terms. The raw file host has no robots.txt.",
  parts: { ar: 'Arabic', zh: 'Chinese', es: 'Spanish', hi: 'Hindi', ru: 'Russian', ja: 'Japanese', ko: 'Korean', pl: 'Polish', sw: 'Swahili', tr: 'Turkish' },
  async fetch() {
    const names: Record<string, string> = { 'gpt-5-medium': 'GPT-5', 'grok-4-0709': 'Grok 4', 'claude-opus-4-1-20250805-0K': 'Claude Opus 4.1',
      'gemini-2.5-pro': 'Gemini 2.5 Pro', 'qwen3-max-preview-thinking': 'Qwen 3 Max Preview', 'deepseek-reasoner': 'DeepSeek V3.1 Reasoner',
      'mistral-medium-2508': 'Mistral Medium 3.1', 'kimi-k2-0905': 'Kimi K2-0905' };
    const data = parseCsv(await fetchText(feed));
    const mean = (a: number[]) => a.reduce((s, n) => s + n, 0) / a.length;
    const rows: LeaderboardRow[] = [];
    for (const [id, observations] of Object.entries(Object.groupBy(data, r => r.translator_model))) {
      if (!observations || !names[id]) throw new Error('Unknown translation model ' + id);
      const metrics: Record<string, number> = {}, scores: number[] = [];
      for (const [lang, items] of Object.entries(Object.groupBy(observations, r => r.lang_code))) {
        if (!items || !board.parts![lang]) throw new Error('Unknown language ' + lang);
        const values = Object.values(Object.groupBy(items, r => r.sample_id)).map(judgments => {
          if (!judgments || new Set(judgments.map(j => j.judge_model)).size !== 5 || judgments.length !== 5) throw new Error('Incomplete judging panel');
          const v = judgments.map(j => Number(j.score));
          if (!v.every(Number.isFinite)) throw new Error('Invalid judge score');
          return mean(v);
        });
        if (values.length !== 200) throw new Error('Missing items in ' + lang);
        metrics[lang] = mean(values);
        scores.push(...values);
      }
      if (scores.length !== 2000) throw new Error('Missing translation language');
      const score = mean(scores);
      const half = 3 * Math.sqrt(scores.reduce((s, x) => s + (x - score) ** 2, 0) / ((scores.length - 1) * scores.length));
      rows.push({ model: names[id], setting: id === 'gpt-5-medium' ? 'medium reasoning' : id.endsWith('-0K') ? 'no reasoning' : undefined, score, low: score - half, high: score + half, metrics });
    }
    if (rows.length < 8) throw new Error('Missing translation models');
    return rows;
  },
};

export default board;
