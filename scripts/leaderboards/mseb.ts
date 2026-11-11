// MSEB published normalized 0–100 averages from the public Gradio dataframes. Overall is the unweighted macro-average of normalized SVQ task scores; retain category metrics and whole-benchmark ASR conditions.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { num } from '../lib/html.ts';

const FEED = "https://google-mseb-leaderboard.hf.space/config";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "mseb",
  url: "https://huggingface.co/spaces/google/mseb-leaderboard",
  feed: FEED,
  terms: "Public results published by the benchmark authors at google-mseb-leaderboard.hf.space; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const config = await fetchJson<any>(FEED);
    let tab = 'Overall';
    const out: LeaderboardRow[] = [];
    for (const c of config.components) {
      if (c.type === 'tabitem') tab = c.props.label;
      if (c.type !== 'dataframe' || tab !== 'Overall') continue;
      const t = c.props.value, head = t?.headers ?? [];
      const mi = head.indexOf('Model'), si = head.findIndex((h: string) => h === 'Average ⬆️' || h === 'Task Average');
      if (mi < 0 || si < 0) continue;
      for (const r of t.data) {
        const name = String(r[mi]).replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
        const score = num(String(r[si])); if (score === undefined) continue;
        const metrics: Record<string,number> = {};
        for (let i = si+1; i < head.length; i++) { const v = num(String(r[i])); if (v !== undefined) metrics[head[i]] = v; }
        out.push({model: identity(name), score, setting: [r[head.indexOf('Tags')] === '-' ? '' : r[head.indexOf('Tags')]].filter(Boolean).join('; '), metrics});
      }
    }
    if (!out.length) throw new Error('MSEB dataframe scores missing');
    return out;
  },
};
export default board;
