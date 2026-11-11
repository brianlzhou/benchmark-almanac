// Irregular states that GPT-6 Cyber solved all 22 Atomic challenges at least once. The count becomes the share solved. This is the latest updated challenge set. Earlier Astra and Sol runs use different snapshots and are excluded. Domain success rates remain metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const FEED = "https://www.irregular.com/research/assessing-gpt-6-cyber-against-offensive-security-benchmarks";
const board: Leaderboard = {
  benchmark: "atomic-challenges-irregular",
  url: "https://www.irregular.com/research/assessing-gpt-6-cyber-against-offensive-security-benchmarks",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {

const s=text(await fetchText(FEED));const m=s.match(/On Atomic Challenges, (GPT-6 Cyber) solved all (\d+) challenges[.] Average success rates were (\d+)% in vulnerability research and exploitation, (\d+)% in network attack simulation, and (\d+)% in evasion/);
if(!m||Number(m[2])!==22)throw new Error('Atomic result or task set changed');return [{model:m[1],score:100,metrics:{solved:Number(m[2]),tasks:Number(m[2]),vulnerability:Number(m[3]),network:Number(m[4]),evasion:Number(m[5])}}];

    })();
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (r.score < 0 || r.score > 100) throw new Error('Score outside percent range');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;
