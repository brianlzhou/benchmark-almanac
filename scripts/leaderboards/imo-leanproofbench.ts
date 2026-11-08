// IMO-LeanProofBench: use the two explicitly published overall solve rates across all 60 problems.
// The page reports Gemini 3.1 Pro under one-shot generation and LEAP's overall solve rate in prose.
// Basic/advanced table scores are subsets. Do not synthesize overall scores for the other systems.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';
const FEED = "https://imobench.github.io/";
const board: Leaderboard = {
  benchmark: "imo-leanproofbench", url: "https://imobench.github.io/", feed: FEED,
  terms: "Public official results, subject to the source repository license and host terms.",
  async fetch() {
    const source = await fetchText(FEED);
    const section = text(source.split('<section id="imo-leanproofbench">')[1]?.split('</section>')[0] ?? '');
    const rows: LeaderboardRow[] = [];
    const gemini = section.match(/Gemini 3\.1 Pro solving only ([\d.]+)% overall \(([\d.]+)% on basic and ([\d.]+)% on advanced/);
    const leap = section.match(/With LEAP,[\s\S]*?overall solve rate of ([\d.]+)%[\s\S]*?solving ([\d.]+)% of the Basic subset and ([\d.]+)% of the Advanced/);
    if (gemini) rows.push({model: 'Gemini 3.1 Pro', score: Number(gemini[1]), setting: 'one-shot', metrics:{basic:Number(gemini[2]),advanced:Number(gemini[3])}});
    if (leap) rows.push({model: 'LEAP (Agentic Prover)', harness: 'LEAP', score: Number(leap[1]), metrics:{basic:Number(leap[2]),advanced:Number(leap[3])}});
    if (!gemini || !leap) throw new Error('Published IMO-LeanProofBench overall rates missing');
    if (!rows.length) throw new Error("No imo-leanproofbench score rows");
    return rows;
  },
};
// Undated family names do not identify a release. Keep these as unlisted source entries.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows()).map(r => ({...r,
  model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4|gpt[- ]?3\.5(?:[- ]turbo)?|gemini[- ]?(?:1\.5[- ](?:pro|flash)|2\.5[- ](?:pro|flash)|2\.0[- ]flash)|claude[- ]?3\.5[- ]?sonnet|deepseek[- ]v3)$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model,
}));
export default board;

