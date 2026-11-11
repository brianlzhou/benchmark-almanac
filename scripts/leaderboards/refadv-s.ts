// RefAdv-S: grounding accuracy at IoU 0.5 in percent is the headline score. Reconstruct full model names from Qwen family section rows; preserve CoT status, stricter IoU accuracies, and distractor-count diagnostics. Human subset references are excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const FEED = "https://ref-adv.github.io/";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "refadv-s",
  url: "https://ref-adv.github.io/",
  feed: FEED,
  terms: "Public results published by the benchmark authors at ref-adv.github.io; retain source attribution and follow the upstream terms.",
  aliases: {"Qwen2.5-VL-3B-Instruct": "qwen2-5-vl-3b", "Qwen2.5-VL-7B-Instruct": "qwen2-5-vl-7b", "Qwen2.5-VL-32B-Instruct": "qwen2-5-vl-32b", "Qwen2.5-VL-72B-Instruct": "qwen2-5-vl-72b"},
  
  async fetch() {
    const t = tables(await fetchText(FEED)).find(t => t[0]?.some(c => c.text === 'CoT'));
    if (!t) throw new Error('RefAdv-S results missing');
    let family = ''; const rows: LeaderboardRow[] = [];
    for (const r of t.slice(2)) {
      if (r.length === 1 && /^Qwen/.test(r[0].text)) { family = r[0].text; continue; }
      const score = num(r[2]?.text);
      if (!family || score === undefined || /^human/i.test(r[0]?.text)) continue;
      const metrics: Record<string, number> = {};
      ['iou075', 'iou09', 'distractors2to3', 'delta2to3', 'distractors4to6', 'delta4to6', 'distractors7plus', 'delta7plus'].forEach((k, i) => { const n = num(r[i + 3]?.text); if (n !== undefined) metrics[k] = n; });
      rows.push({ model: family + '-' + r[0].text, score, setting: /check|✓/.test(r[1]?.text) ? 'CoT' : 'without CoT', metrics });
    }
    if (!rows.length) throw new Error('RefAdv-S score rows missing');
    return rows;
  },
};
export default board;
