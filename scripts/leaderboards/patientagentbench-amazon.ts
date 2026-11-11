// PatientAgentBench: published aggregate clinical-agent score on its original 1–5 scale.
// Six dimensions retain their means and bracketed percentages separately.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

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


const FEED = "https://raw.githubusercontent.com/amazon-science/PatientAgentBench/main/README.md";
const board: Leaderboard = {
  "benchmark": "patientagentbench-amazon",
  "url": "https://github.com/amazon-science/PatientAgentBench",
  "feed": "https://raw.githubusercontent.com/amazon-science/PatientAgentBench/main/README.md",
  "terms": "The authors publish this public results feed; no separate score-reuse license is stated, and attribution remains with the authors."
,
  async fetch(): Promise<LeaderboardRow[]> {

    const t = markdownTables(await fetchText(FEED)).find(t => t[0].includes('Aggregate'));
    if (!t) throw new Error('PatientAgentBench table missing');
    return t.slice(1).filter(r => numeric(r[2]) !== undefined).map(r => {
      const metrics: Record<string,number> = {};
      for (const [i,key] of ['taskCompletion','clinicalSafety','workflowAccuracy','triageQuality','clinicalHelpfulness','conversationalQuality'].entries()) {
        const m = r[i+3]?.match(/([\d.]+)\s*\[(\d+)%\]/);
        if (m) { metrics[key] = Number(m[1]); metrics[`${key}Percent`] = Number(m[2]); }
      }
      return {model: identity(r[1]), score:numeric(r[2])!, metrics};
    });
  },
};
export default board;
