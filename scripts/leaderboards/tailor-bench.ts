// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// TailOR evaluates visual depictions of tool interactions. Its website lists instruction adherence first in each scenario.
// Checklist percentages and zero-to-five ratings retain their separate scales.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { jsLiteral } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://tailor-bench.github.io/';
const scenarios = { reg: 'Regular', unc: 'Unconventional', imp: 'Impossible' };
const criteria = { ia: 'Instruction Adherence', int: 'Interaction Accuracy', phys: 'Physical Realism', perc: 'Perceptual Quality' };
type Result = { setting: string; modality: string; model: string } &
  Record<keyof typeof scenarios, Record<keyof typeof criteria, { a: number; h: number }>>;
const board: Leaderboard = {
  benchmark: 'tailor-bench', url: feed, feed,
  terms: 'The authors publish results on their GitHub Pages site. https://docs.github.com/en/site-policy/github-terms/github-terms-of-service',
  headline: 'The score is the plain mean instruction adherence percentage across regular, unconventional and impossible interactions.',
  aliases: { 'HuanyuanVideo': 'hunyuan-video-1-5', 'Wan-2.2': 'wan2-2-t2v-a14b', 'GPT-Img-1': 'gpt-image-1', 'Qwen-Img': 'qwen-image' },
  async fetch() {
    const page = await fetchText(feed);
    const literal = page.match(/const data = (\[[\s\S]*?\n\s*\]);/)?.[1];
    if (!literal || !page.includes('title="Instruction Adherence"')) throw Error('Missing TailOR results array');
    const data = jsLiteral<Result[]>(literal.replace(/'([a-zA-Z0-9.-]+)'/g, '"$1"'), 0);
    const parts: NonNullable<Leaderboard['parts']> = {};
    const rows = data.flatMap(r => (['h','a'] as const).map(judge => {
      const metrics: Record<string,number> = {};
      for (const s of Object.keys(scenarios) as (keyof typeof scenarios)[]) {
        for (const c of Object.keys(criteria) as (keyof typeof criteria)[]) {
          const key = scenarios[s] + ': ' + criteria[c];
          const value = r[s]?.[c]?.[judge];
          if (!Number.isFinite(value)) throw Error('Missing rating for ' + r.model);
          parts[key] = { name: key, unit: c === 'ia' || c === 'int' ? '%' : 'score' };
          metrics[key] = value;
        }
      }
      const score = (r.reg.ia[judge] + r.unc.ia[judge] + r.imp.ia[judge])/3;
      return { model: r.model, score, metrics, setting: [r.setting,r.modality,judge === 'h' ? 'human evaluation' : 'automatic evaluation'].join(', ') };
    }));
    board.parts = parts;
    return checked(rows, 32);
  },
};
export default board;
