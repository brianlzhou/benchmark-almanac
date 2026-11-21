// MIREX ranks music preference systems by accuracy on the 249 core pairs. The results wiki gives vocal and instrumental extensions.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://futuremirex.com/mirex/wiki/2026:Music_Evaluation_via_CMI-RewardBench_Results";


const board: Leaderboard = {
  benchmark: "mirex-2026-cmi-rewardbench",
  url: "https://futuremirex.com/mirex/wiki/2026:Music_Evaluation_via_CMI-RewardBench_Results",
  feed,
  terms: "The wiki footer specifies the GNU Free Documentation License 1.2 unless otherwise noted. https://futuremirex.com/mirex/wiki/2026:Music_Evaluation_via_CMI-RewardBench_Results The robots.txt route returns HTML.",
  parts: { vocal:'Vocal Extension (300+)', instrumental:'Instrumental Extension (300+)' },
  async fetch() {
    const t = tables(await fetchText(feed)).find(t=>t[0].map(c=>c.text).join('|') === 'Rank|System|Core Overall (249)|Vocal Extension (300+)|Instrumental Extension (300+)');
    if (!t || t.length < 15) throw new Error('Missing MIREX leaderboard');
    return t.slice(1).map(c=>{
      const name = c[1].html.split(/\s*\(?<a\b/)[0].trim();
      const model = name.replace(/\s*\(User ID: \d+\)$/, '').trim();
      const submitter = name.match(/User ID: \d+/)?.[0];
      const [score,vocal,instrumental] = c.slice(2).map(cell=>Number(cell.text));
      if (!model || ![score,vocal,instrumental].every(Number.isFinite)) throw new Error('Invalid MIREX system');
      return {model,submitter,link:c[1].html.match(/href="([^"]+)"/)?.[1],score,metrics:{vocal,instrumental}};
    });
  },
};
export default board;
