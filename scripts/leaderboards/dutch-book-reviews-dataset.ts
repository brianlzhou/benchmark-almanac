// DBRD tests sentiment classification in Dutch book reviews. EuroEval publishes scores for its DBRD-mini test split.
// The Dutch board reports Matthews correlation first, then macro F1, both scaled by 100.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { text } from '../lib/html.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
const feed = 'https://euroeval.com/leaderboards/dutch';
export default {
  benchmark:'dutch-book-reviews-dataset',url:feed,feed,host:'EuroEval',
  terms:'EuroEval code is MIT licensed. https://github.com/EuroEval/EuroEval',
  aliases: {
    'nvidia/NVIDIA-Nemotron-3-Nano-4B-BF16':'nemotron-3-nano-4b',
    'meta-llama/Llama-2-70b-hf':'llama-2-70b',
    'nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16':'nemotron-3-nano-30b-a3b',
    'mistralai/Mistral-Small-3.1-24B-Instruct-2503':'mistral-small-3-1',
    'mistralai/Mistral-Small-3.2-24B-Instruct-2506':'mistral-small-3-2',
  },
  headline:'EuroEval reports Matthews correlation on its DBRD-mini test split, scaled by 100.',
  stats: {
    macroF1: { name: 'Macro F1', unit: '%', better: 'higher' },
    scored: { name: 'Scored examples', unit: 'count' },
  },
  async fetch() {
    const page = await fetchText(feed);
    const script = page.match(/<script\b[^>]*src="([^"]*\/index-[^"]+\.js)"/)?.[1];
    if (!script) throw new Error('Missing EuroEval entry script');
    const url = new URL(script,feed);
    await new Promise(resolve => setTimeout(resolve,1000));
    const entry = await fetchText(url.href);
    const asset = entry.match(/"\/src\/frontend\/csv\/dutch_all_models\.csv"[^}]{0,120}?import\(\x60([^\x60]+)\x60\)/)?.[1];
    if (!asset) throw new Error('Missing Dutch CSV module');
    await new Promise(resolve => setTimeout(resolve,1000));
    const module = await fetchText(new URL(asset,url).href);
    const data = module.match(/\n(Rank,Model,[^\x60]+)\x60/);
    if (!data) throw new Error('Missing Dutch leaderboard CSV');
    const records = parseCsv(data[1]);
    const key = Object.keys(records[0] ?? {}).find(k => text(k) === 'dbrd');
    if (!key) throw new Error('Missing DBRD column');
    const rows = records.filter(r => r[key] !== '-' && !/\([^)]*\bval\)$/.test(text(r.Model))).map(r => {
      const values = r[key].match(/^(-?[\d.]+) ± ([\d.]+) \/ ([\d.]+) ± ([\d.]+)$/);
      if (!values) throw new Error('Malformed DBRD result');
      const [score,margin,f1,f1Margin] = values.slice(1).map(Number);
      const label = text(r.Model);
      const settings = label.match(/ \(([^()]+)\)$/);
      const [model,mode] = label.replace(/ \([^()]+\)$/,'').split('#');
      return {model,setting:[mode,settings?.[1]].filter(Boolean).join(', ') || undefined,
        score,low:score-margin,high:score+margin,link:r.Model.match(/href='([^']+)'/)?.[1],open:r.Open === '✓',
        metrics:{macroF1:f1,macroF1Low:f1-f1Margin,macroF1High:f1+f1Margin,scored:Number(r.dbrd_scored),failures:Number(r.dbrd_failures)}};
    });
    return checked(rows,369);
  },
} satisfies Leaderboard;
