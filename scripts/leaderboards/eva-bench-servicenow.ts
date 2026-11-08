// EVA-Bench: the current page bundle embeds published voice-system data as JSON, read without executing it.
// Pooled EVA-A pass@1 is the headline on its original 0–1 score scale; EVA-X and domain scores remain metrics.
// Systems without a clean evaluation are not assigned a score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { text, tables, num, jsonAfter } from '../lib/html.ts';

const clean = (s: string) => text(s.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*`]/g, '')).trim();
function markdownTables(source: string): string[][][] {
  const out: string[][][] = []; let table: string[][] = [];
  for (const line of source.split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) { if (table.length) out.push(table); table = []; continue; }
    const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(clean);
    if (cells.every(c => /^:?-+:?$/.test(c.replace(/\s/g, '')))) continue;
    table.push(cells);
  }
  if (table.length) out.push(table);
  return out;
}
const numeric = (s: string | undefined): number | undefined => {
  const v = (s ?? '').replace(/\\/g, '').replace(/[🥇🥈🥉🏅]/gu, '').replace(/[_*`]/g, '').replace(/,/g, '').replace(/^[~≈<>≤≥$\s]+/, '').trim();
  const m = v.match(/^(-?\d+(?:\.\d+)?)(?:\s*(?:%|±|\(|$))/);
  return m ? Number(m[1]) : undefined;
};
const identity = (name: string) => /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?4[- ]turbo|gpt[- ]?3\.?5[- ]?turbo|gemini[- ]?1\.5[- ]?(?:pro|flash)|claude[- ]?3\.5[- ]?sonnet)$/i.test(name)
  ? `${name} (snapshot unspecified)` : name;


const FEED = "https://servicenow.github.io/eva/";
const board: Leaderboard = {
  "benchmark": "eva-bench-servicenow",
  "url": "https://servicenow.github.io/eva/",
  "feed": "https://servicenow.github.io/eva/",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch(): Promise<LeaderboardRow[]> {
    const page = await fetchText(FEED);
    const src = page.match(/src="(\.\/assets\/index-[^"]+\.js)"/)?.[1];
    if (!src) throw new Error('EVA data bundle missing');
    await new Promise(resolve => setTimeout(resolve, 1100));
    const js = await fetchText(new URL(src, FEED).href);
    const at = js.indexOf("JSON.parse('[{\"id\"");
    if (at < 0) throw new Error('EVA systems payload missing');
    const systems = jsonAfter<any[]>(js.slice(at), "JSON.parse('");
    const rows: LeaderboardRow[] = [];
    for (const s of systems) {
      const point = s.clean?.['EVA-A_pass']?.pooled;
      if (typeof point?.point !== 'number') continue;
      const metrics: Record<string, number> = {ciLow:point.ci_lower,ciHigh:point.ci_upper};
      for (const [key, value] of Object.entries(s.clean) as [string, any][]) {
        if (typeof value.pooled?.point === 'number') metrics[key] = value.pooled.point;
        for (const [domain, v] of Object.entries(value.per_domain ?? {}) as [string, any][]) {
          if (typeof v.point === 'number') metrics[`${key}_${domain}`] = v.point;
        }
      }
      rows.push({model:s.name,score:point.point,setting:'clean; pooled EVA-A pass@1',harness:s.type === 'cascade' ? `STT: ${s.stt}; LLM: ${s.llm}; TTS: ${s.tts}` : 'speech-to-speech',metrics});
    }
    if (!rows.length) throw new Error('No clean EVA results');
    return rows;
  },
};
export default board;
