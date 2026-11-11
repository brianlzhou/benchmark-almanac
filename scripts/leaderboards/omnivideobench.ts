// OmniVideoBench: published overall accuracy in percent across the full question set.
// Frame limits and no-audio input ablations are whole-benchmark configurations.
// Duration buckets remain metrics; model size is not a run setting.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAfter } from '../lib/html.ts';

const FEED = "https://omnivideobench.github.io/omnivideobench_home/static/data/leaderboard.js";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "omnivideobench",
  url: "https://omnivideobench.github.io/omnivideobench_home/static/data/leaderboard.js",
  feed: FEED,
  terms: "Public results published by the benchmark authors at omnivideobench.github.io; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    type Entry = { name: string; params: string; frames: string | number; overall: number; short: number; medium: number; long: number; ultraLong: number; no_audio?: boolean };
    const { models } = jsonAfter<{ models: Entry[] }>(await fetchText(FEED), 'window.LEADERBOARD_DATA =');
    const rows = models.filter(r => Number.isFinite(r.overall)).map(r => {
      const name = /^(Qwen2.5-VL|InternVL3|LLaVA-OneVision)$/.test(r.name) ? `${r.name}-${r.params}` : r.name;
      return { model: identity(name), score: r.overall,
        setting: `${r.no_audio ? 'without audio' : 'standard audio setting'}${/^\d+$/.test(String(r.frames))?`; frames ${r.frames}`:""}`,
        metrics: { short: r.short, medium: r.medium, long: r.long, ultraLong: r.ultraLong } };
    });
    if (!rows.length) throw new Error('OmniVideoBench models missing');
    return rows;
  },
};
export default board;
