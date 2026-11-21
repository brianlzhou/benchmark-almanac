// Miðeind scores Icelandic terminology. The published family score combines Textile Terms with Flora & Fauna.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';
interface Model { family_scores: Record<string, number>; display_name: string; model_url?: string; params_b?: number; license?: string; thinking?: string; tools: string[]; benchmark_evaluated_at: Record<string, string>; scores: Record<string, Record<string, number>> }


const feed = "https://huggingface.co/spaces/mideind/icelandic-llm-leaderboard/raw/main/leaderboard.json";
const board: Leaderboard = {
  benchmark: 'mideind-icelandic-terminology',
  url: "https://mideind-icelandic-llm-leaderboard.static.hf.space/",
  feed,
  terms: "Both hosts allow crawling. family:terminology uses a 0 to 1 scale in the feed. The 102 configurations cover 60 model names. Credit Miðeind under CC BY 4.0. https://huggingface.co/spaces/mideind/icelandic-llm-leaderboard/blob/main/README.md",
  parts: { 'Textile Terms': 'Textile Terms', 'Textile Terms: abbreviation': 'Textile Terms: Abbreviation', 'Textile Terms: meaning': 'Textile Terms: Meaning', 'Flora & Fauna': 'Flora and Fauna', 'Flora & Fauna: Fuglar': 'Flora and Fauna: Birds', 'Flora & Fauna: Gróður': 'Flora and Fauna: Plants', 'Flora & Fauna: Sjávardýr': 'Flora and Fauna: Marine Animals', 'Flora & Fauna: Smádýr': 'Flora and Fauna: Small Animals' },
  aliases: { 'Llama 3.1 70B Instruct': 'llama-3-1-70b', 'Llama 3.1 8B Instruct': 'llama-3-1-8b' },
  async fetch() {
    const data = await fetchJson<{models: Model[]}>(feed);
    const rows = data.models.flatMap(m => {
      const score = m.family_scores.terminology;
      if (score == null) return [];
      if (!m.display_name || !Number.isFinite(score)) throw new Error('Invalid terminology score');
      const metrics: Record<string, number> = {};
      const dates = new Set<string>();
      for (const [key, group, primary] of [['icelandic_textiles@v1', 'Textile Terms', 'llm_judge_score'], ['icelandic_nature_translations@v1', 'Flora & Fauna', 'accuracy']]) {
        const part = m.scores[key];
        if (!part || !Number.isFinite(part[primary])) throw new Error('Missing ' + group);
        for (const [name, value] of Object.entries(part)) {
          const label = name === primary ? group : group + ': ' + name.replace(primary + '_', '');
          if (!Number.isFinite(value)) throw new Error('Invalid ' + label);
          board.parts![label] = label;
          metrics[label] = value * 100;
        }
        if (m.benchmark_evaluated_at[key]) dates.add(m.benchmark_evaluated_at[key].slice(0,10));
      }
      return [{ model: m.display_name, score: score * 100, setting: [m.thinking, ...m.tools].filter(Boolean).join(', ') || undefined,
        license: m.license || undefined, params: m.params_b ?? undefined, link: m.model_url || undefined, date: dates.size === 1 ? [...dates][0] : undefined, metrics }];
    });
    if (rows.length < 105) throw new Error('Incomplete terminology standings');
    return rows;
  },
};
export default board;
