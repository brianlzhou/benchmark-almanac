// TableBench overall percentages with FC, NR, DA and VIZ metrics, with prompting strategies as whole-benchmark settings. Remove affiliation markup and exclude the human baseline.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const FEED = "https://tablebench.github.io/";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "tablebench",
  url: "https://tablebench.github.io/",
  feed: FEED,
  terms: "Public results published by the benchmark authors at tablebench.github.io; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const out: LeaderboardRow[] = [];
    for (const t of tables(await fetchText(FEED))) {
      const head = t[0]?.map(c => c.text) ?? [];
      if (!head.includes('Model')) continue;
      for (const r of t.slice(1)) {
        let name = text((r[1]?.html ?? '').split(/<br\s*\/?\s*>/i)[0]).replace(/🤔/gu, '').trim();
        if (!name || /human/i.test(name)) continue;
        let setting: string | undefined = /-high\b/i.test(name) ? 'high' : undefined;
        const protocol = name.match(/\s*\+\s*(DP|TCoT|SCoT|PoT)$/); if (protocol) {setting = [setting, protocol[1]].filter(Boolean).join('; '); name = name.slice(0, protocol.index).trim();}
        if (head.includes('Overall')) {
          const score = num(r.at(-1)?.text); if (score === undefined) continue;
          const metrics: Record<string, number> = {};
          ['FC','NR','DA','VIZ'].forEach((k, i) => { const v = num(r[i+2]?.text); if (v !== undefined) metrics[k] = v; });
          out.push({model: identity(name), score, setting, metrics});
        } else if (head.includes('DP')) {
          for (const [i, protocol] of ['DP','TCoT','SCoT','PoT'].entries()) {
            const score = num(r[i+3]?.text); if (score === undefined) continue;
            out.push({model: identity(name), score, setting: [/-high\b/i.test(name) ? 'high' : '', protocol].filter(Boolean).join('; ')});
          }
        }
      }
    }
    if (!out.length) throw new Error('TableBench tables missing');
    const seen = new Set<string>();
    return out.filter(r => {
      const key = JSON.stringify([r.model, r.setting, r.score]);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  },
};
export default board;
