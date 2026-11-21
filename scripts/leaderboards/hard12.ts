// Hard12 measures pass@1 across 12 coding tasks with three attempts per task.
// The All Runs table separates pass@3 from pass^3.
// The author's All Runs table identifies models, team setups, pass rates, cost and elapsed time.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const url = 'https://ibragim.dev/leaderboard-v2/';
const board: Leaderboard = {
  benchmark: 'hard12', url, feed: url,
  terms: 'Public All Runs table on the author’s website.',
  aliases: { 'Opus 5.5': 'claude-opus-5-5', 'Haiku 5.5': 'claude-haiku-5-5' },
  async fetch() {
    const html = await fetchText(url);
    const table = tables(html).find(t => t[0]?.map(c => c.text).join('|') === 'Setup|Type|pass@1|pass@3|pass-all-3|$/task|Time/task');
    if (!table || table.length < 42) throw new Error('Incomplete Hard12 table');
    const interval = text(html).match(/95% task-bootstrap interval for pass@1 is ([\d.]+)[–-]([\d.]+)%/);
    return table.slice(1).map(c => {
      const setup = c[0].text.replace(/\s+new$/i, '');
      const names = [...setup.matchAll(/GPT-[\d.]+ (?:Terra|Sol|Luna)|Opus 5\.5|Haiku 5\.5|DeepSeek V[\d.]+ Flash(?: \d{4})?|Qwen[\d.]+ \d+B|Kimi K[\d.]+(?: Pro)?|reflection\/beam|\bSol(?= (?:cross-review|review loop))|\bOpus(?= cross-review)/g)].map(m => m[0]);
      const clock = c[6]?.text.match(/^(\d+):(\d\d)$/);
      const [score, passAt3, passAll3] = c.slice(2, 5).map(v => num(v.text));
      if (!names.length || !clock || score === undefined || passAt3 === undefined || passAll3 === undefined) throw new Error('Unknown Hard12 setup: ' + setup);
      return { model: names[0], models: names.length > 1 ? names : undefined, setting: setup,
        harness: setup.match(/\(([^,)]+)(?:, [^)]*)?\)/)?.[1] ?? c[1].text, score, trials: 3, cost: num(c[5].text),
        ...(interval && setup.includes('(Porch)') ? { low: +interval[1], high: +interval[2] } : {}),
        metrics: { passAt3, pass3: passAll3, latency: Number(clock[1]) * 60 + Number(clock[2]) },
      };
    });
  },
};
export default board;
