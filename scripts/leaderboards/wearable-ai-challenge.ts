// Wearable-AI Challenge — Meta FAIR held-out test phase leaderboard across EgoConv, EgoLongQA, and EgoProactive.
// Parses the Python BOARDS literal purely as data from facebook/wearable-ai-leaderboard/raw/main/final_rankings.py
// (44 ranked submissions across 3 tracks and 2 parameter divisions).

import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://huggingface.co/spaces/facebook/wearable-ai-leaderboard/raw/main/final_rankings.py';

function parsePyLiteral(src: string): unknown {
  let i = 0;
  const skipWs = () => {
    while (i < src.length) {
      if (/\s/.test(src[i])) {
        i++;
      } else if (src[i] === '#') {
        while (i < src.length && src[i] !== '\n') i++;
      } else {
        break;
      }
    }
  };
  const parseString = (): string => {
    const q = src[i++];
    let out = '';
    while (i < src.length && src[i] !== q) {
      if (src[i] === '\\' && i + 1 < src.length) {
        const nxt = src[i + 1];
        out += nxt === 'n' ? '\n' : nxt === 't' ? '\t' : nxt;
        i += 2;
      } else {
        out += src[i++];
      }
    }
    if (src[i] !== q) throw new Error('Unterminated Python string in final_rankings.py');
    i++;
    return out;
  };
  const parseValue = (): unknown => {
    skipWs();
    if (i >= src.length) throw new Error('Unexpected EOF in BOARDS literal');
    const ch = src[i];
    if (ch === '(' || ch === '[') {
      const close = ch === '(' ? ')' : ']';
      i++;
      const arr: unknown[] = [];
      skipWs();
      while (i < src.length && src[i] !== close) {
        arr.push(parseValue());
        skipWs();
        if (src[i] === ',') {
          i++;
          skipWs();
        }
      }
      if (src[i] !== close) throw new Error('Unclosed Python tuple in final_rankings.py');
      i++;
      return arr;
    }
    if (ch === '"' || ch === "'") {
      let str = parseString();
      skipWs();
      while (i < src.length && (src[i] === '"' || src[i] === "'")) {
        str += parseString();
        skipWs();
      }
      return str;
    }
    if (src.startsWith('True', i)) {
      i += 4;
      return true;
    }
    if (src.startsWith('False', i)) {
      i += 5;
      return false;
    }
    if (src.startsWith('None', i)) {
      i += 4;
      return null;
    }
    const nm = src.slice(i).match(/^-?\d+(?:\.\d+)?/);
    if (nm) {
      i += nm[0].length;
      return Number(nm[0]);
    }
    throw new Error(`Unexpected token at ${i} in final_rankings.py: ${src.slice(i, i + 20)}`);
  };
  return parseValue();
}

function cleanDivision(div: string): string {
  return div
    .replace(/Small Model\s*\([^)]*\)/i, 'Small <=2B')
    .replace(/Large Model\s*\([^)]*\)/i, 'Large 2B+')
    .replace(/≤/g, '<=')
    .trim();
}

function parseParamsBillions(raw: string): number | undefined {
  const m = raw.trim().match(/^(\d+(?:\.\d+)?)\s*([BM])$/i);
  if (!m) return undefined;
  const v = Number(m[1]);
  const b = m[2].toUpperCase() === 'M' ? v / 1000 : v;
  return b > 0 ? b : undefined;
}

const board: Leaderboard = {
  benchmark: 'wearable-ai-challenge',
  feed: FEED,
  url: 'https://huggingface.co/spaces/facebook/wearable-ai-leaderboard',
  terms: 'Public Hugging Face Space published by Meta FAIR.',
  headline: 'Primary held-out test score per track: LLM-as-Judge on EgoConv, Accuracy on EgoLongQA, and Macro F1 on EgoProactive.',
  stats: {
    bleu: { name: 'BLEU', unit: 'score', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const py = await fetchText(FEED);
    const start = py.indexOf('BOARDS =');
    if (start < 0) throw new Error('Wearable-AI Challenge BOARDS literal not found');
    const eq = py.indexOf('(', start);
    if (eq < 0) throw new Error('Wearable-AI Challenge BOARDS opening paren not found');
    const boards = parsePyLiteral(py.slice(eq)) as unknown[];

    const rows: LeaderboardRow[] = [];
    for (const entry of boards) {
      if (!Array.isArray(entry) || entry.length < 4) continue;
      const track = String(entry[0]);
      const division = cleanDivision(String(entry[1]));
      const metric = String(entry[2]);
      const subRows = entry[3];
      if (!Array.isArray(subRows)) continue;
      const setting = `${track}, ${division}`;

      for (const r of subRows) {
        if (!Array.isArray(r) || r.length < 6) continue;
        const team = String(r[0]).trim();
        const rawModel = String(r[1]).trim();
        const paramsRaw = String(r[2]).trim();
        const openRaw = String(r[3]).trim();
        const score = Number(r[4]);
        if (!rawModel || !Number.isFinite(score)) continue;

        // Qualify generic single-word model labels with team name to avoid false matches against base releases.
        const model = /^(?:Qwen|Qwen\(\d+\)|internvl\d+b?|qwen3vl|my_?model(?:-v\d+)?|Vertex|GRU-only)$/i.test(rawModel)
          ? `${rawModel} (${team})`
          : rawModel;

        const row: LeaderboardRow = {
          model,
          score,
          setting,
          submitter: team,
        };
        const p = parseParamsBillions(paramsRaw);
        if (p !== undefined) row.params = p;
        if (/^yes$/i.test(openRaw)) row.open = true;
        else if (/^no$/i.test(openRaw)) row.open = false;

        if (metric === 'LLM-as-Judge' && r.length >= 7 && r[6] !== null && r[6] !== undefined) {
          const bleu = Number(r[6]);
          if (Number.isFinite(bleu)) row.metrics = { bleu };
        }
        rows.push(row);
      }
    }

    if (rows.length < 40) throw new Error(`Wearable-AI Challenge parsed only ${rows.length} rows`);
    return rows;
  },
};

export default board;
