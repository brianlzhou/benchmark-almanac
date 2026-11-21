// MANDOS tests whether operators consult an expert during industrial incidents.
// Read the Run 003 outcome matrix. The page headlines the pass rate on the seven real incidents and lists four synthetic controls.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const FEED = "https://www.relayforge.tools/mandos/";
const board: Leaderboard = {
  benchmark: "mandos-run-003",
  url: "https://www.relayforge.tools/mandos/",
  feed: FEED,
  terms: "RelayForge marks Run 003 CC BY 4.0. The site publishes content signals in robots.txt.",
  parts: { synthetic: 'Synthetic controls' },
  async fetch() {
    const table = tables(await fetchText(FEED))[0]?.map(row => row.map(c => c.text));
    const incidents = table?.filter(r => /^ANOR-\d+/.test(r[0]));
    const controls = table?.filter(r => /^SYNTH-\d+/.test(r[0]));
    if (!table || table[0].join('|') !== 'Scenario|Gemini 2.5|GPT-4o|Grok|Grok+GPT5|Llama 70B|Qwen 32B|Skipped ×4' || incidents?.length !== 7 || controls?.length !== 4) throw new Error('MANDOS Run 003 matrix changed');
    return table[0].slice(1, -1).map((label, i) => {
      const metrics: Record<string, number> = {};
      const passRate = (rows: string[][]) => 100 * rows.reduce((n,r) => {
        const value = r[i + 1].toLowerCase();
        if (!['pass','fail'].includes(value)) throw new Error('Missing MANDOS outcome for ' + label);
        const key = r[0].match(/^(?:ANOR|SYNTH)-\d+/)![0];
        board.parts![key] = r[0];
        metrics[key] = value === 'pass' ? 100 : 0;
        return n + Number(value === 'pass');
      }, 0) / rows.length;
      const score = passRate(incidents);
      metrics.synthetic = passRate(controls);
      return { model: label === 'Grok+GPT5' ? 'Grok' : label, score, metrics,
        setting: label === 'Grok+GPT5' ? 'GPT-5.5 grader' : label === 'Grok' ? 'Claude Opus judge' : undefined };
    });
  },
};
export default board;
