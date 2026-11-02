// Berkeley Function Calling Leaderboard before V4 (the record for BFCL V1 to V3; bfcl-v4.ts reads the live
// board, which now shows V4 only). A BFCL maintainer, Huanzhi Mao, keeps dated copies of the leaderboard's
// CSV files in HuanzhiMao/BFCL-Result (Apache-2.0). The 2025-06-14 copy is the last one in V3 form (the next,
// 2025-08-26, adds the V4 web search and memory columns), so it is the frozen V3 board read here, and its
// date is passed to the resolver. "Overall Acc" is the score. Model names end in the calling mode, "(FC)"
// or "(Prompt)", which goes to the harness, as in bfcl-v4.ts, whose aliases are reused.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import v4 from './bfcl-v4.ts';

const SNAPSHOT = '2025-06-14';
const FEED = `https://raw.githubusercontent.com/HuanzhiMao/BFCL-Result/main/${SNAPSHOT}/score/data_overall.csv`;

const board: Leaderboard = {
  benchmark: 'berkeley-function-calling-leaderboard-bfcl',
  url: 'https://github.com/HuanzhiMao/BFCL-Result',
  feed: `${FEED} (last V3 copy of the leaderboard)`,
  terms: "A BFCL maintainer's public archive of the leaderboard files (HuanzhiMao/BFCL-Result), Apache-2.0.",
  aliases: {
    ...v4.aliases,
    'xLAM-2-70b-fc-r': 'xlam-2-70b-fc-r',
  },
  async fetch() {
    const csv = parseCsv(await fetchText(FEED));
    if (!csv[0] || 'Web Search Acc' in csv[0] || !('Multi Turn Acc' in csv[0])) throw new Error('snapshot is not in V3 form');
    return csv
      .filter((r) => r.Model && /%$/.test(r['Overall Acc']))
      .map((r) => {
        const mode = r.Model.match(/\s*\(((FC|Prompt)\b[^)]*)\)\s*$/);
        const name = mode ? r.Model.slice(0, mode.index).trim() : r.Model.trim();
        const thinking = mode && /thinking/i.test(mode[1]) ? 'thinking' : undefined;
        return {
          model: name,
          score: parseFloat(r['Overall Acc']),
          setting: thinking,
          harness: mode ? (mode[2] === 'FC' ? 'native function calling' : 'prompted') : undefined,
          date: SNAPSHOT,
        };
      });
  },
};
export default board;
