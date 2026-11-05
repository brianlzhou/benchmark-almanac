// Berkeley Function Calling Leaderboard before V4 (the record for BFCL V1 to V3, while bfcl-v4.ts reads the
// live board, which now shows V4 only). A BFCL maintainer, Huanzhi Mao, keeps dated copies of the leaderboard's
// CSV files in HuanzhiMao/BFCL-Result (Apache-2.0). The 2025-06-14 copy is the last one in V3 form (the next,
// 2025-08-26, adds the V4 web search and memory columns), so it is the frozen V3 board read here, and its
// date is passed to the resolver. "Overall Acc" is the score. Model names end in the calling mode, "(FC)"
// or "(Prompt)", which goes to the harness, as in bfcl-v4.ts, whose aliases are reused.
// "Cost ($ Per 1k Function Calls)" over 1,000 is the cost per test entry (`cost`), and "Latency Mean (s)" and
// "Latency 95th Percentile (s)" are kept as metrics.latency and metrics.latencyP95, as in bfcl-v4.ts.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { num } from '../lib/html.ts';
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
    // names that carry their snapshot date, which the resolver reads as a later snapshot
    'GPT-4o-2024-11-20': 'gpt-4o-nov-2024',
    'Gemini-2.5-Pro-Preview-05-06': 'gemini-2-5-pro-may-2025',
    'Claude-3.5-Sonnet-20241022': 'claude-3-5-sonnet-october-2024',
    'Gemini-2.0-Flash-001': 'gemini-2-0-flash-feb-2025',
    'Gemini-2.0-Flash-Lite-001': 'gemini-2-0-flash-lite',
    'Mistral-small-2503': 'mistral-small-3-1',
    'Amazon-Nova-Lite-v1:0': 'amazon-nova-lite',
    'Llama-3.1-70B-Instruct': 'llama-3-1-70b',
    'DBRX-Instruct': 'dbrx',
    'Phi-4-mini-instruct': 'phi-4-mini',
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
        const per1k = num(r['Cost ($ Per 1k Function Calls)']);
        const latency = num(r['Latency Mean (s)']);
        const latencyP95 = num(r['Latency 95th Percentile (s)']);
        const metrics = { ...(latency === undefined ? {} : { latency }), ...(latencyP95 === undefined ? {} : { latencyP95 }) };
        return {
          model: name,
          score: parseFloat(r['Overall Acc']),
          setting: thinking,
          harness: mode ? (mode[2] === 'FC' ? 'native function calling' : 'prompted') : undefined,
          date: SNAPSHOT,
          cost: per1k === undefined ? undefined : per1k / 1000,
          ...(Object.keys(metrics).length ? { metrics } : {}),
        };
      });
  },
};
export default board;
