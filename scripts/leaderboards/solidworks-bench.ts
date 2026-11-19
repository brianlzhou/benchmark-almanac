// SolidWorks Bench (Markov): agents model and assemble 73 machines in SolidWorks from PNG drawing packages, one
// attempt each at high reasoning effort. Read from the page's Markdown version: the mean reward (0 to 1), the three
// weighted areas, the eleven graded components, and the cost table. The tables give short names ("Kimi K3.1"), and
// the reward-against-cost chart on the HTML page names each model in full ("Kimi K3.1 Pro"), matched by the color the
// page gives both. Without that, "Muse Spark" and "GLM 5.3" would land on the wrong models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://www.markovstudios.com/research/solidworks-bench';
const MD = `${PAGE}.md`;
const N = 9;

/** The rows of the Markdown table whose header starts with `head`, as cell arrays (header and rule left out). */
function table(md: string, head: string): string[][] {
  const lines = md.split('\n');
  const at = lines.findIndex((l) => l.startsWith(head));
  if (at < 0) throw new Error(`SolidWorks Bench: table "${head}" missing`);
  const out: string[][] = [];
  for (const l of lines.slice(at + 2)) {
    if (!l.startsWith('|')) break;
    out.push(l.split('|').slice(1, -1).map((c) => c.trim()));
  }
  return out;
}
const num = (s: string) => Number(s.replace(/[$,h\s]/g, ''));

const COMPONENTS: [string, string, string, string][] = [
  ['parts', 'Parts', 'Geometry', 'Every face of each modeled part checked against the reference at 0.025 mm and 0.1°, plus the exact volume difference. 25% of the reward.'],
  ['placement', 'Placement', 'Geometry', 'Every pair of parts that touch in the reference, graded on how the two sit against each other. 20% of the reward.'],
  ['ties', 'Ties', 'Assembly function', 'Each component mated to a neighbor it really touches, weighted by how well it sits. 10% of the reward.'],
  ['motion', 'Motion', 'Assembly function', 'SolidWorks drags each joint: hinges turn about the right axis, slides slide and rigid parts hold. 10% of the reward.'],
  ['lockFree', 'Lock-free', 'Assembly function', 'No Lock-mate shortcuts. 5% of the reward.'],
  ['patterns', 'Patterns', 'Assembly function', 'Repeated components placed by patterns. 5% of the reward.'],
  ['sketches', 'Sketches', 'Part practice', 'Sketches fully defined without Fix relations. 4% of the reward.'],
  ['holes', 'Holes', 'Part practice', 'Hole features where the drawing calls for them. 4% of the reward.'],
  ['partPatterns', 'Part patterns', 'Part practice', 'Repeated features patterned, not copied. 4% of the reward.'],
  ['materials', 'Materials', 'Part practice', 'The material from the bill of materials on each part. 7% of the reward.'],
  ['flex', 'Flex', 'Part practice', 'A key dimension changed by 5 to 30%, rebuilt, and compared with the reference changed the same way. 6% of the reward.'],
];

const board: Leaderboard = {
  benchmark: 'solidworks-bench',
  url: PAGE,
  feed: `${MD} (Mean reward, Where the reward comes from, Every graded component, Cost and efficiency) and ${PAGE} (full model names in the reward-against-cost chart)`,
  terms: 'robots.txt allows all pages, and the site publishes a Markdown copy of each page for language models and agents. Markov states no data license. Results are credited to Markov.',
  costPer: 'task',
  async fetch() {
    const [md, html] = await Promise.all([fetchText(MD), fetchText(PAGE)]);
    // short name -> full name, through the color each label and chart point wears
    const short = new Map([...html.matchAll(/<span class="ml"[^>]*style="--c:(#[0-9A-Fa-f]{6})"[^>]*><i class="sw"[^>]*><\/i>([^<]+)<\/span>/g)].map((m) => [m[2].trim(), m[1].toUpperCase()]));
    const full = new Map([...html.matchAll(/fill="(#[0-9A-Fa-f]{6})"[^>]*><title>([^<]+)<\/title>/g)].map((m) => [m[1].toUpperCase(), m[2].trim()]));
    const nameOf = (s: string) => {
      const n = full.get(short.get(s) ?? '');
      if (!n) throw new Error(`SolidWorks Bench: no full name for "${s}" in the chart`);
      return n;
    };
    const areas = new Map(table(md, '| Model | Geometry').map((r) => [r[0], r.slice(1).map(num)]));
    const comps = new Map(table(md, '| Model | Parts | Placement').map((r) => [r[0], r.slice(1).map(num)]));
    const cost = new Map(table(md, '| Model | $ / machine').map((r) => [r[0], r]));
    const mean = table(md, '| Model | Mean reward');
    const rows: LeaderboardRow[] = mean.map(([m, s]) => {
      const a = areas.get(m), c = comps.get(m), k = cost.get(m);
      if (!a || a.length !== 3 || !c || c.length !== COMPONENTS.length || !k) throw new Error(`SolidWorks Bench: ${m} missing from a breakdown table`);
      return {
        model: nameOf(m),
        score: num(s),
        setting: 'high',
        trials: 1,
        cost: num(k[1]),
        metrics: {
          geometry: a[0], assembly: a[1], practice: a[2],
          ...Object.fromEntries(COMPONENTS.map(([key], i) => [key, c[i]])),
          medianTurns: num(k[3]), medianHours: num(k[4]), timeLimitHit: num(k[5]),
        },
      };
    });
    if (rows.length < N) throw new Error(`SolidWorks Bench: ${rows.length} models, expected at least ${N}`);
    return rows;
  },
};
export default board;
