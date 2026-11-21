// Skills IL compares factual accuracy on Hebrew questions about life in Israel.
// The page data contain results and confidence intervals for unaided, web search and supplied skills runs.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { nextFlight, jsonAt, tables } from '../lib/html.ts';

const FEED = "https://agentskills.co.il/en/leaderboard";
type Score = { mean: number; lo: number; hi: number };
type Outcomes = { right: number; wrong: number; abstain: number };
type Result = { label: string; modelId: string; open: boolean; facts: {
  plain: Score; search: Score; skill: Score; plainOutcomes: Outcomes; searchOutcomes: Outcomes;
  byCategory: Record<string, number>; uplift: number;
} };
const board: Leaderboard = {
  benchmark: "skills-il-israel-knowledge",
  url: "https://agentskills.co.il/en/leaderboard",
  feed: FEED,
  terms: "The organizers offer a download. Site terms restrict copying, automated collection and commercial use. The MIT license applies to individual skills. https://agentskills.co.il/en/terms The robots file permits the leaderboard and its download.",
  parts: { tax: 'Tax', employment: 'Employment', btl: 'National Insurance', consumer: 'Consumer', documents: 'Documents' },
  async fetch() {
    const html = await fetchText(FEED);
    const flight = nextFlight(html);
    const results = jsonAt<Result[]>(flight, flight.indexOf('[{"modelId"'));
    const date = html.match(/"dateModified":"(\d{4}-\d{2}-\d{2})/)?.[1];
    const table = tables(html).find(t => t[0]?.some(c => c.text.startsWith('Passes as human')));
    if (!date || !table || results.length < 14 || table.length !== results.length + 1) throw new Error('Missing Skills IL rankings');
    return results.flatMap(({ label, modelId, open, facts }) => {
      const human = table.find(r => r[1]?.text === label)?.at(-1)?.text.match(/(\d+)% of guesses.*?range (\d+)%-(\d+)%/);
      return (['plain', 'search', 'skill'] as const).map(mode => {
        const { mean, lo, hi } = facts[mode];
        const metrics: Record<string, number> = {};
        const outcomes = mode === 'plain' ? facts.plainOutcomes : mode === 'search' ? facts.searchOutcomes : undefined;
        if (outcomes) Object.assign(metrics, outcomes);
        if (mode === 'plain') {
          for (const key of Object.keys(board.parts!)) metrics[key] = facts.byCategory[key] * 100;
          if (human) Object.assign(metrics, { passesAsHuman: +human[1], humanLow: +human[2], humanHigh: +human[3] });
        }
        if (mode === 'skill') metrics.uplift = facts.uplift * 100;
        if (!label || ![mean, lo, hi, ...Object.values(metrics)].every(Number.isFinite)) throw new Error('Invalid Skills IL result');
        // The board gives no release for Gemini Pro. Keep the family separate from the 1.0 catalog entry.
        const model = label === 'Gemini Pro' ? 'Gemini Pro (release unspecified)' : label;
        return { model, score: mean * 100, low: lo * 100, high: hi * 100, open, metrics, date,
          link: new URL('/en/leaderboard/models/' + modelId, FEED).href,
          setting: { plain: 'Unaided', search: 'With web search', skill: 'With skill' }[mode] };
      });
    });
  },
};
export default board;
