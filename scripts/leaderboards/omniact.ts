// OmniACT tests desktop and web agents that write scripts from interface screenshots.
// SOTA2's full test table reports action scores for each planner and grounding configuration.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://www.sota2.com/research/sota/action-sequence-generation-on-omniact-test';
const board: Leaderboard = {
  benchmark: 'omniact', host: 'SOTA2', url, feed: url, harnesses: 'system',
  terms: 'SOTA2 credits the underlying sources and lists third-party rights at https://www.sota2.com/mcp-terms.',
  async fetch() {
    const table = tables(await fetchText(url)).find(t => t[0]?.map(c => c.text).join('|') === 'Method|Links|Action Score');
    if (!table) throw new Error('OmniACT action score table missing');
    return checked(table.slice(1).map(([method, links, value]) => {
      const name = text(method.html.match(/<a\b[^>]*>([\s\S]*?)<\/a>/)?.[1] ?? '');
      const config = text(method.html.match(/<span\b[^>]*role="tooltip"[^>]*>([\s\S]*?)<\/span>/)?.[1] ?? '');
      const match = /^Inputs=(.+), Planner=(.+)$/.exec(config);
      if (!name || !match || !/^\d+(?:\.\d+)?$/.test(value.text)) throw new Error('Invalid OmniACT configuration');
      const [, inputs, planner] = match;
      const score = Number(value.text);
      const dm = method.html.match(/<small>(\d{4})\.(\d{2})<\/small>/);
      const date = dm ? `${dm[1]}-${dm[2]}-01` : undefined;
      const paper = links.html.match(/href="(\/research\/paper\/[^"]+)"/i)?.[1];
      const link = links.html.match(/href="(https?:\/\/[^"]+)"/i)?.[1] ?? (paper ? `https://www.sota2.com${paper}` : undefined);
      if (name === 'DetACT') return { model: planner, harness: name, setting: inputs, score, ...(date ? { date } : {}), ...(link ? { link } : {}) };
      return { model: name, models: [name, planner], harness: inputs.match(/\(([^)]+)\)/)?.[1], setting: config, score, ...(date ? { date } : {}), ...(link ? { link } : {}) };
    }), 8);
  },
};
export default board;
