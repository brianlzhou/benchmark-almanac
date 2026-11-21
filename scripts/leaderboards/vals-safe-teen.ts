// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// SAFE-Teen tests chatbot responses to simulated teens. The board divides failures by resolved judgments in each risk area.
// The results component supplies separate test arms with and without a teen-aware prompt.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral, jsonAt } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://www.vals.ai/benchmarks/mental-health';
interface Arm {
  label: string; modelKey: string; condition: string; cohort: string; conversationCount: number; scenarioCount: number;
  criteria: { id: string; resolvedCount: number; counts: { fail?: number } }[];
}
async function asset(base: string, path?: string) {
  if (!path) throw new Error('Missing SAFE-Teen results asset');
  const url = new URL(path, base).href;
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { url, text: await fetchText(url) };
}
const board: Leaderboard = {
  benchmark: 'vals-safe-teen', url, feed: url,
  headline: 'Vals AI reports no overall score, so the headline is the plain mean of its three risk-area failure rates.',
  terms: 'Vals AI reserves all rights on its public benchmark page. https://www.vals.ai/benchmarks/mental-health',
  parts: { urgent: 'Urgent safety', health: 'Health advice', relationships: 'Relationship boundaries' },
  stats: {conversations:{name:'Conversations',unit:'count'},scenarios:{name:'Scenarios',unit:'count'}},
  async fetch() {
    const html = await fetchText(url);
    const component = await asset(url, html.match(/component-url="([^"]*\/MentalHealthResults\.[^"]+)"/)?.[1]);
    const data = await asset(component.url, component.text.match(/from"(\.\/shared\.[^"]+)"/)?.[1]);
    const encoded = data.text.match(/arms:(\[[\s\S]*?\]),riskAreas:/)?.[1];
    const mapStart = data.text.indexOf('{"Respond to suicide risk":');
    if (!encoded || mapStart < 0) throw new Error('Missing SAFE-Teen arms or risk-area assignments');
    const areas = jsonAt<Record<string, number>>(data.text, mapStart);
    const normalized = encoded.replace(/`([^`$\\]*)`/g, (_, s: string) => JSON.stringify(s)).replace(/:\.(\d)/g, ':0.$1');
    const arms = jsLiteral<Arm[]>(normalized, 0);
    const rows = arms.map(arm => {
      const fails = [0, 0, 0], totals = [0, 0, 0];
      for (const c of arm.criteria) {
        const i = areas[c.id];
        if (![0, 1, 2].includes(i)) throw new Error('Unknown risk area for ' + c.id);
        fails[i] += c.counts.fail ?? 0;
        totals[i] += c.resolvedCount;
      }
      if (totals.some(t => !(t > 0))) throw new Error('Empty risk area');
      const rates = fails.map((v, i) => 100 * v / totals[i]);
      const muse = arm.modelKey === 'meta/muse_spark_1_3';
      const prompt = { 'no-prompt': 'No teen-aware prompt', 'u18-prompt': 'Teen-aware prompt' }[arm.condition];
      if (!prompt) throw new Error('Unknown prompt condition');
      return { model: muse ? 'Muse Spark 1.3' : arm.label, setting: [prompt, muse && (arm.cohort === 'frontier' ? 'Extra High' : 'Minimal')].filter(Boolean).join(', '),
        score: rates.reduce((a, b) => a + b) / 3, metrics: { urgent: rates[0], health: rates[1], relationships: rates[2], conversations: arm.conversationCount, scenarios: arm.scenarioCount } };
    });
    return checked(rows, 36);
  },
};
export default board;
