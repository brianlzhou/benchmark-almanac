// People compare pairs of image edits in the SuperCLUE Arena. The leaderboard ranks the models by median rating.
// The arena page loads a JavaScript file for each board with model ratings, intervals and battle counts.
import type { Leaderboard } from './types.ts';
import { jsLiteral } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';
import { SC_SITE, SC_TERMS, scChunk } from './superclue.ts';

let arenaPage: Promise<string> | undefined;
interface ArenaEntry {
  model: string;
  median: number;
  ciLow: number;
  ciHigh: number;
  battles: string | number;
}

export function arenaBoard(benchmark: string, url: string, feed: string, minimum: number, aliases: Record<string, string> = {}): Leaderboard {
  return {
    benchmark, url, feed, terms: SC_TERMS, aliases,
    async fetch() {
      arenaPage ??= scChunk('ArenaPage-');
      const prefix = new URL(feed).pathname.split('/').pop()!.split('-')[0];
      const name = (await arenaPage).match(new RegExp('(?:^|/)' + prefix + '-([\\w-]+)\\.js'))?.[0].replace(/^\//, '');
      if (!name) throw new Error(`Missing arena board script for ${prefix}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      const js = await fetchText(SC_SITE + '/assets/' + name);
      const start = js.indexOf('rows:[');
      if (start < 0) throw new Error(`Missing arena rows in ${name}`);
      const entries = jsLiteral<ArenaEntry[]>(js.slice(start + 5).replace(/:!0(?=[,}])/g, ':true').replace(/:!1(?=[,}])/g, ':false'), 0);
      if (entries.length < minimum) throw new Error(`Expected at least ${minimum} rows in ${name}`);
      return entries.map(entry => {
        const { model, median, ciLow, ciHigh } = entry;
        const battles = Number(String(entry.battles).replaceAll(',', ''));
        if (!model || ![median, ciLow, ciHigh, battles].every(Number.isFinite)) throw new Error(`Incomplete arena entry: ${model}`);
        const setting = model.match(/\[(\d+p|\d+[x×]\d+)\]$/i)?.[1];
        return { model, setting, score: median, low: ciLow, high: ciHigh, metrics: { battles } };
      });
    },
  };
}

export default arenaBoard(
  'superclue-arena-image-editing',
  'https://www.superclueai.com/arena?type=image&tab=board',
  'https://www.superclueai.com/assets/IEBoard-Bd6Ck5Si.js',
  19,
  {
    'Qwen-Image-2.0-Pro（2026-03-03）': 'qwen-image-2-0-pro',
    'Doubao-Seededit-3.0-i2i': 'seededit-3-0',
  },
);
