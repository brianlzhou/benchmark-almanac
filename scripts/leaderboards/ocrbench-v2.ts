// OCRBench v2, private test data, English and Chinese tasks. 99franklin.github.io/ocrbench_v2/ is a static page with
// one pair of tables per leaderboard round (2026.09 back to 2025.06, newest first): English, then Chinese.
// Use the newest round only and the English table shown first, the page's default view.
// Its published Average is the headline percentage. Chinese Average is a secondary metric
// for models in the same round, never a competing leaderboard row.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const PAGE = 'https://99franklin.github.io/ocrbench_v2/';

const board: Leaderboard = {
  benchmark: 'ocrbench-v2',
  url: PAGE,
  feed: `${PAGE} (static HTML, newest round, default English Average)`,
  terms: 'Static GitHub Pages site that states no terms; the MultimodalOCR repository is MIT.',
  aliases: {
    'Gemini1.5-Pro': 'gemini-1-5-pro-sept-2024',
    'NVIDIA Nemotron 3.5 Super VL': 'nemotron-3-5-super-vl',
    'NVIDIA Nemotron 3 Nano Omni 30B A3B': 'nemotron-3-nano-omni-30b-a3b',
    'Qwen3-Omni-30B-A3B-Instruct': 'qwen3-omni-30b-a3b',
  },
  async fetch() {
    const html = await fetchText(PAGE);
    // each round is a container id="leaderboard-YYYY-MM" holding its English table, then its Chinese one
    const starts = [...html.matchAll(/<div\b[^>]*\bid="leaderboard-(\d{4})-(\d{2})"[^>]*>/g)];
    if (!starts.length) throw new Error('no leaderboard rounds on the OCRBench v2 page');
    const seen = new Set<string>();
    const rows: LeaderboardRow[] = [];
    starts.slice(0, 1).forEach((m, i) => {
      const section = html.slice(m.index, starts[i + 1]?.index ?? html.length);
      const languageTables = tables(section);
      for (const [languageIndex, english] of languageTables.slice(0, 2).entries()) {
      const head = english?.[0]?.map((c) => c.text);
      if (head?.[1] !== 'Method' || head?.[5] !== 'Average') throw new Error(`unexpected OCRBench v2 header: ${head?.join(' | ')}`);
      for (const r of english.slice(1)) {
        const model = r[1]?.text.replace(/[\u{1F947}-\u{1F949}]/gu, '').trim();
        const score = num(r[5]?.text);
        if (!model || score === undefined || seen.has(`${languageIndex}|${model}`)) continue;
        seen.add(`${languageIndex}|${model}`);
        if (languageIndex === 1) {
          const row = rows.find(r => r.model === model);
          if (row) (row.metrics ??= {}).chinese = score;
          continue;
        }
        rows.push({ model, score, metrics: Object.fromEntries(head.slice(6).flatMap((h, j) => { const v = num(r[j + 6]?.text); return v === undefined ? [] : [[h, v]]; })), date: `${m[1]}-${m[2]}-28` });
      }
      }
    });
    return rows;
  },
};
// An evaluation date does not establish a model snapshot. Preserve ambiguous names as unlisted entries.
const snapshotFetch = board.fetch;
board.fetch = async () => (await snapshotFetch()).map(r => {
  const name = r.model.replace(/^[\w.-]+\//, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (name === "kimik2thinking") return r;
  return /^(?:gpt4|gpt4o|gpt4turbo|gpt4v|chatgpt4o(?:latest)?|gpt35(?:turbo)?|gemini15(?:pro|flash)|gemini25(?:pro|flash|flashlite)|gemini20flash|claude35sonnet|deepseekr1|deepseekv3|kimik2(?:instruct)?)(?:preview|latest|thinking|thinkingmode|nonthinking)?$/.test(name) ? {...r, model: `${r.model} (snapshot unspecified)`} : r;
});
export default board;
