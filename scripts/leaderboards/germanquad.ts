// GermanQuAD tests extractive question answering in German. EuroEval scores its GermanQuAD-mini test split.
// The German understanding leaderboard gives character-level F1 and exact match with uncertainty margins.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { text } from '../lib/html.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
const feed = 'https://euroeval.com/leaderboards/german';
export default {
  benchmark:'germanquad',url:feed,feed,host:'EuroEval',
  terms:'EuroEval code is MIT licensed. https://github.com/EuroEval/EuroEval',
  aliases: {
    'nvidia/NVIDIA-Nemotron-3-Nano-4B-BF16':'nemotron-3-nano-4b',
    'meta-llama/Llama-2-70b-hf':'llama-2-70b',
    'nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16':'nemotron-3-nano-30b-a3b',
    'mistralai/Mistral-Small-3.1-24B-Instruct-2503':'mistral-small-3-1',
    'mistralai/Mistral-Small-3.2-24B-Instruct-2506':'mistral-small-3-2',
  },
  headline:'EuroEval reports character-level F1 on the GermanQuAD-mini test split, scaled by 100.',
  async fetch() {
    const page = await fetchText(feed);
    const script = page.match(/<script\b[^>]*src="([^"]*\/index-[^"]+\.js)"/)?.[1];
    if (!script) throw new Error('Missing EuroEval entry script');
    const url = new URL(script,feed);
    await new Promise(resolve => setTimeout(resolve,1000));
    const entry = await fetchText(url.href);
    const asset = entry.match(/"\/src\/frontend\/csv\/german_understanding\.csv"[^}]{0,120}?import\(\x60([^\x60]+)\x60\)/)?.[1];
    if (!asset) throw new Error('Missing German CSV module');
    await new Promise(resolve => setTimeout(resolve,1000));
    const module = await fetchText(new URL(asset,url).href);
    const data = module.match(/\n(Rank,Model,[^\x60]+)\x60/);
    if (!data) throw new Error('Missing German leaderboard CSV');
    const records = parseCsv(data[1]);
    const key = Object.keys(records[0] ?? {}).find(k => text(k) === 'germanquad');
    if (!key) throw new Error('Missing GermanQuAD column');
    const rows = records.filter(r => r[key] !== '-' && !/\([^)]*\bval\)$/.test(text(r.Model))).map(r => {
      const values = r[key].match(/^(-?[\d.]+) ± ([\d.]+) \/ ([\d.]+) ± ([\d.]+)$/);
      if (!values) throw new Error('Malformed GermanQuAD result');
      const [score,margin,em,emMargin] = values.slice(1).map(Number);
      const label = text(r.Model);
      const settings = label.match(/ \(([^()]+)\)$/);
      const [model,mode] = label.replace(/ \([^()]+\)$/,'').split('#');
      return {model,setting:[mode,settings?.[1]].filter(Boolean).join(', ') || undefined,
        score,low:score-margin,high:score+margin,link:r.Model.match(/href='([^']+)'/)?.[1],open:r.Open === '✓',
        metrics:{exactMatch:em,exactMatchLow:em-emMargin,exactMatchHigh:em+emMargin,scored:Number(r.germanquad_scored),failures:Number(r.germanquad_failures)}};
    });
    return checked(rows,288);
  },
} satisfies Leaderboard;
