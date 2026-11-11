// OpenAI articles embed the exact chart values in Next.js flight data. Read JSON only, never execute specs.
// OpenAI sometimes challenges Node fetch. An HTTP/1.1 curl fallback keeps the Almanac user agent.
import { fetchText } from '../util.ts';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execFileAsync = promisify(execFile);
import { nextFlight, jsonAt } from '../html.ts';

export interface VegaSpec {
  title?: string | string[] | { text?: string };
  data?: { values?: Record<string, unknown>[] };
  transform?: { calculate?: string; as?: string }[];
}
export const OPENAI_TERMS = 'OpenAI terms restrict automated extraction; Benchmark Almanac credits OpenAI and links the official source.';
export async function openaiHtml(url: string): Promise<string> {
  let html: string;
  try { html = await fetchText(url); }
  catch (error) {
    if (!/403/.test(String(error))) throw error;
    await new Promise(resolve => setTimeout(resolve, 1100));
    if (new URL(url).hostname !== 'openai.com') throw error;
    try {
      const result = await execFileAsync('curl', ['--http1.1', '--fail', '--silent', '--show-error', '--location', '--max-time', '60', '--user-agent', 'benchmark-almanac (+https://github.com/brianlzhou/benchmark-almanac)', url], { timeout: 65000, maxBuffer: 16000000 });
      html = result.stdout;
    } catch {
      html = await archivedHtml(url);
    }
  }
  return html;
}

// openai.com answers scripts with a Cloudflare challenge. The almanac reads these pages anyway (decided 2026-11-10),
// so the last fallback is the Internet Archive's newest copy that loaded (status 200). OpenAI's
// articles don't change after they're published, so the copy carries the same chart data.
async function archivedHtml(url: string): Promise<string> {
  const bare = url.replace(/^https?:\/\//, '');
  const index = JSON.parse(await fetchText(`https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(bare)}&filter=statuscode:200&output=json&fl=timestamp&limit=-1`)) as string[][];
  const ts = index.length > 1 ? index.at(-1)![0] : undefined;
  if (!ts) throw new Error(`No archived copy of ${url}`);
  const html = await fetchText(`https://web.archive.org/web/${ts}id_/${url}`);
  if (/Just a moment/.test(html.slice(0, 4000))) throw new Error(`The archived copy of ${url} is a challenge page`);
  return html;
}
export async function openaiSpecs(url: string): Promise<VegaSpec[]> {
  const flight = nextFlight(await openaiHtml(url));
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
