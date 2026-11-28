// We-Math: strict average reasoning accuracy, in percent, is the headline score. Keep loose accuracy and the strict/loose reasoning diagnostics as separately named metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const FEED = "https://we-math.github.io/";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "we-math",
  parts: {
    S1: { name: 'One-step problems', group: 'Step count' },
    S2: { name: 'Two-step problems', group: 'Step count' },
    S3: { name: 'Three-step problems', group: 'Step count' },
    'UCU(Mem)': { name: 'Understanding and conversion of units', group: 'Measurement' },
    'AL(Mem)': { name: 'Angles and length', group: 'Measurement' },
    'CPF(PF)': { name: 'Calculation of plane figures', group: 'Plane figures' },
    'UPF(PF)': { name: 'Understanding of plane figures', group: 'Plane figures' },
    'CSF(SF)': { name: 'Calculation of solid figures', group: 'Solid figures' },
    'USF(SF)': { name: 'Understanding of solid figures', group: 'Solid figures' },
    'BTF(TMF)': { name: 'Basic transformations of figures', group: 'Transformations and motion of figures' },
    'CCF(TMF)': { name: 'Cutting and combining of figures', group: 'Transformations and motion of figures' },
    'Dir(PD)': { name: 'Direction', group: 'Position and direction' },
    'Pos(PD)': { name: 'Position', group: 'Position and direction' },
    'RoM(PD)': { name: 'Route map', group: 'Position and direction' },
    'CCP(PD)': { name: 'Correspondence of coordinates and positions', group: 'Position and direction' },
  },
  stats: {
    'Avg(Loose)': { name: 'Loose average accuracy', unit: '%', better: 'higher' },
    'IK(Strict)': { name: 'Insufficient knowledge (strict)', unit: '%', better: 'lower' },
    'IG(Strict)': { name: 'Inadequate generalization (strict)', unit: '%', better: 'lower' },
    'CM(Strict)': { name: 'Complete mastery (strict)', unit: '%', better: 'higher' },
    'RM(Strict)': { name: 'Rote memorization (strict)', unit: '%', better: 'lower' },
    'IK(Loose)': { name: 'Insufficient knowledge (loose)', unit: '%', better: 'lower' },
    'IG(Loose)': { name: 'Inadequate generalization (loose)', unit: '%', better: 'lower' },
    'CM(Loose)': { name: 'Complete mastery (loose)', unit: '%', better: 'higher' },
    'RM(Loose)': { name: 'Rote memorization (loose)', unit: '%', better: 'lower' },
  },
  url: "https://we-math.github.io",
  feed: FEED,
  terms: "Public results published by the benchmark authors at we-math.github.io; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const out: LeaderboardRow[] = [];
    const all = tables(await fetchText(FEED));
    const diagnostic = all.find(t => t[0]?.some(c => c.text === 'S1'));
    const clean = (value: string) => value.replace(/[🏅🥇🥈🥉†‡*]/gu, '').trim();
    for (const t of all) {
      const head = t[0]?.map(c => c.text.replace(/<\/?strong>?/gi, '').trim()) ?? [];
      if (!(head.includes('Avg(Strict)'))) continue;
      for (const r of t.slice(1)) {
        const name = (r[1]?.text)?.replace(/[🏅🥇🥈🥉†‡*]/gu, '').trim();
        const score = num(r[4]?.text);
        if (!name || /^(?:human|random|oracle)(?:\b|$)/i.test(name) || score === undefined) continue;
        const metrics: Record<string, number> = {};
        for (let i = 5; i < Math.min(head.length, r.length); i++) {
          if (i === 1 || i === 4) continue;
          const v = num(r[i]?.text); if (v !== undefined) metrics[head[i]] = v;
        }
        const secondary = diagnostic?.slice(1).find(v => clean(v[1]?.text ?? '') === name && v[3]?.text === r[3]?.text);
        if (secondary && diagnostic) {
          for (let j = 4; j < secondary.length; j++) {
            const value = num(secondary[j].text);
            if (value !== undefined) metrics[diagnostic[0][j].text] = value;
          }
        }
        out.push({ model: identity(name), score: score * 1, setting: undefined, metrics });
      }
    }
    if (!out.length) throw new Error("we-math: expected score table missing");
    return out;
  },
};
export default board;
