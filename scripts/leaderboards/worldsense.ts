import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
const FEED = 'https://raw.githubusercontent.com/facebookresearch/worldsense/main/README.md';
const board: Leaderboard = {
 benchmark: 'worldsense', url: 'https://github.com/facebookresearch/worldsense', feed: FEED,
 terms: 'Official public repository. The almanac credits Meta and links the original source.',
 parts: {
  inferTrivial: 'Inference trivial',
  inferNormal: 'Inference normal',
  consistTrivial: 'Consistency trivial',
  consistNormal: 'Consistency normal',
  complTrivial: 'Completeness trivial',
  complNormal: 'Completeness normal',
 },
 stats: {
  biasInferTrivial: { name: 'Inference trivial bias', unit: 'score' },
  biasInferNormal: { name: 'Inference normal bias', unit: 'score' },
  biasConsistTrivial: { name: 'Consistency trivial bias', unit: 'score' },
  biasConsistNormal: { name: 'Consistency normal bias', unit: 'score' },
  biasComplTrivial: { name: 'Completeness trivial bias', unit: 'score' },
  biasComplNormal: { name: 'Completeness normal bias', unit: 'score' },
 },
 async fetch() {
  const readme = await fetchText(FEED);
  const block = readme.split('AVERAGE ACCURACY ACROSS ALL PROBLEMS')[1]?.split('ACCURACY for each')[0];
  if (!block) throw new Error('WorldSense aggregate table missing');
  const parseGrid = (text: string | undefined) => {
   const map = new Map<string, number[]>();
   for (const line of (text ?? '').split(/\r?\n/)) {
    const m = line.match(/^(?:basic\s+|\s+)([\w.+-]+)\s+((?:-?\d+\.\d+\s+\([\d.]+\)\s*){6})$/);
    if (!m) continue;
    map.set(m[1], [...m[2].matchAll(/(-?\d+\.\d+)\s+\([\d.]+\)/g)].map(x => Number(x[1])));
   }
   return map;
  };
  const accMap = parseGrid(readme.split('ACCURACY for each of the problems')[1]?.split('BIAS for each')[0]);
  const biasMap = parseGrid(readme.split('BIAS for each of the problems')[1]?.split('```')[0]);
  const accKeys = ['inferTrivial', 'inferNormal', 'consistTrivial', 'consistNormal', 'complTrivial', 'complNormal'] as const;
  const biasKeys = ['biasInferTrivial', 'biasInferNormal', 'biasConsistTrivial', 'biasConsistNormal', 'biasComplTrivial', 'biasComplNormal'] as const;
  const rows = [...block.matchAll(/^([\w.+-]+)\s+(\d+\.\d+)\s+\(([\d.]+)\)/gm)].map(m => {
   const raw = m[1];
   const model = /GPT/.test(raw) ? `${raw} (snapshot unspecified)` : `${raw} (size unspecified)`;
   const score = Number(m[2]), ci = Number(m[3]);
   const metrics: Record<string, number> = { ciLow: Number((score - ci).toFixed(2)), ciHigh: Number((score + ci).toFixed(2)) };
   const acc = accMap.get(raw);
   if (acc?.length === 6) accKeys.forEach((k, i) => { metrics[k] = acc[i]; });
   const bias = biasMap.get(raw);
   if (bias?.length === 6) biasKeys.forEach((k, i) => { metrics[k] = bias[i]; });
   return { model, score, low: Number((score - ci).toFixed(2)), high: Number((score + ci).toFixed(2)), setting: 'basic prompting', metrics };
  });
  if (!rows.length) throw new Error('WorldSense aggregate rows missing');
  return rows;
 },
};
export default board;
