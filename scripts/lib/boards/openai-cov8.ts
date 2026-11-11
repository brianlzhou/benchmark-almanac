// OpenAI articles embed the exact chart values in Next.js flight data. Read JSON only, never execute specs.
import { fetchText } from '../util.ts';
import { nextFlight, jsonAt } from '../html.ts';

export interface VegaSpec {
  title?: string | string[] | { text?: string };
  data?: { values?: Record<string, unknown>[] };
  transform?: { calculate?: string; as?: string }[];
}
export const OPENAI_TERMS = 'OpenAI terms restrict automated extraction; Benchmark Almanac credits OpenAI and links the official source.';
export async function openaiSpecs(url: string): Promise<VegaSpec[]> {
  const flight = nextFlight(await fetchText(url));
  const specs = [...flight.matchAll(/"vegaLiteSpec":/g)].map(m => jsonAt<VegaSpec>(flight, m.index! + m[0].length));
  if (!specs.length) throw new Error('OpenAI article has no readable Vega chart data');
  return specs;
}
export function chartTitle(spec: VegaSpec): string {
  return typeof spec.title === 'string' ? spec.title : Array.isArray(spec.title) ? spec.title.join(' ') : spec.title?.text ?? '';
}
export function chartValues(specs: VegaSpec[], title: string): Record<string, unknown>[] {
  const spec = specs.find(s => chartTitle(s) === title);
  if (!spec?.data?.values?.length) throw new Error(`Missing OpenAI chart: ${title}`);
  return spec.data.values;
}
