// The WMT Turkish gender test scores pronoun accuracy when context identifies gender. Read Set B accuracy and the separate bias measures from Table 1 of the evaluation paper.
import type { Leaderboard } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';

const FEED = "https://aclanthology.org/2026.wmt-main.90.pdf";
const board: Leaderboard = {
  benchmark: "tr-gender-bias", static: 'paper',
  url: "https://aclanthology.org/2026.wmt-main.90.pdf",
  feed: FEED,
  terms: "Use Table 1, Set B accuracy. The author releases the suite and scoring materials under CC BY 4.0. https://aclanthology.org/2026.wmt-main.90.pdf The host has no published robots directives at /robots.txt.",
  parts: {"malformed": {"name": "Malformed", "unit": "%"}, "hedge": {"name": "Hedge", "unit": "%"}, "theyA": {"name": "Set A they", "unit": "%"}, "agreement": {"name": "Set A stereotype agreement", "unit": "%"}, "male": {"name": "Male-typed agreement", "unit": "%"}, "female": {"name": "Female-typed agreement", "unit": "%"}, "skew": {"name": "Male-skew index", "unit": "score"}, "accuracy": {"name": "Set B accuracy", "unit": "%"}, "deltaS": {"name": "\u0394S", "unit": "%"}, "deltaG": {"name": "\u0394G", "unit": "%"}, "theyC": {"name": "Set C they", "unit": "%"}, "over": {"name": "Set C over", "unit": "%"}},
  async fetch() {
    const section = (await pdfText(FEED)).match(/System\s+malf\.\s+hedge\s+they\s+agree\s+agrM\s+agrF\s+skew\s+sig\.\s+acc\s+∆S\s+∆G\s+they\s+over([\s\S]*?)Table 1: Per-system/);
    if (!section) throw new Error('Missing WMT system scores');
    const keys = ['malformed','hedge','theyA','agreement','male','female','skew','significance','accuracy','deltaS','deltaG','theyC','over'];
    const rows = section[1].trim().split(/\n/).filter(line => line.trim()).map(line => {
      const fields = line.trim().split(/\s+/);
      const numbers = fields.splice(-keys.length);
      const model = fields.join(' '), metrics: Record<string,number> = {};
      for (const [i,key] of keys.entries()) {
        if (key === 'significance' || numbers[i] === 'n/a') continue;
        const n = Number(numbers[i].replace('−','-').replace('†',''));
        if (!Number.isFinite(n)) throw new Error('Invalid WMT score for ' + model);
        metrics[key] = n;
      }
      if (!model || !Number.isFinite(metrics.accuracy)) throw new Error('Missing Set B accuracy');
      return { model, score: metrics.accuracy, metrics };
    });
    if (rows.length < 24) throw new Error('Missing WMT systems');
    return rows;
  },
};
export default board;
