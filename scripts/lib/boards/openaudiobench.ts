// OpenAudioBench has five audio task sets. Reasoning and Llama Questions use percentage accuracy; the remaining sets use native judge scores.
import type { Leaderboard, LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchText } from '../util.ts';
import { num, tables, text } from '../html.ts';

const FEED = "https://raw.githubusercontent.com/baichuan-inc/Baichuan-Omni-1.5/main/README.md";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "openaudiobench",
  url: "https://github.com/baichuan-inc/Baichuan-Omni-1.5",
  feed: FEED,
  terms: "Public results published by the benchmark authors at raw.githubusercontent.com; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const table = tables(await fetchText(FEED)).find(t => t[0]?.[0]?.text === 'Audio Comprehensive Capacity');
    if (!table) throw new Error('OpenAudioBench audio table missing');
    const rows: LeaderboardRow[] = [];
    for (const r of table) {
      if (r.length !== 12) continue;
      for (let modality = 0; modality < 2; modality++) for (let task = 0; task < 5; task++) {
        const score = num(r[2 + task * 2 + modality]?.text); if (score === undefined) continue;
        const metrics: Record<string, number> = {};
        for (const [k, at] of [['webQuestionsScore', 6], ['triviaQAScore', 8], ['alpacaEvalScore', 10]] as const) {
          const v = num(r[at + modality]?.text); if (v !== undefined) metrics[k] = v;
        }
        rows.push({ model: identity(r[0].text), score, setting: `${['Reasoning QA','Llama Questions','Web Questions','TriviaQA','AlpacaEval'][task]}; speech-to-${modality ? 'speech' : 'text'}`, metrics });
      }
    }
    if (!rows.length) throw new Error('OpenAudioBench score rows missing');
    return rows;
  },
};
export const sourceBoard = board;

// Each child record selects one complete test set. Remaining settings describe its run.
export async function trackRows(select: string, remove: string): Promise<LeaderboardRow[]> {
 const rows = (await sourceBoard.fetch()).filter(r => new RegExp(select).test(r.setting ?? "")).map(r => ({...r, setting: (r.setting ?? "").replace(new RegExp(remove), "").replace(/^;\s*|;\s*$/g, "").trim() || undefined}));
 if (!rows.length) throw new Error("No rows for track " + select);
 return rows;
}
