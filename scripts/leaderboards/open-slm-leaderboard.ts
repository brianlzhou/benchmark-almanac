// Open SLM Leaderboard (Axiomic Labs): independent benchmark ranking small open-weight language
// models across HellaSwag, ARC-Easy, ARC-Challenge, PIQA, ArithMark-3, and ArithMark-2.
// Reads the inline `const MODELS = [...]` array in index.html and reproduces the Space's default
// headline Intelligence Index (chance-normalized weighted mean: weight 1 each for HellaSwag,
// combined ARC, and PIQA, weight 0.65 for ArithMark-3, minimum 2 metrics; 0 = chance, 100 = perfect).
import { fetchText } from '../lib/util.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';

const FEED = 'https://huggingface.co/spaces/AxiomicLabs/Open_SLM_Leaderboard/raw/main/index.html';

interface SlmEntry {
  name: string;
  org?: string;
  addedDate?: string;
  params?: number;
  arc?: number | null;
  hellaswag?: number | null;
  piqa?: number | null;
  arcChall?: number | null;
  arithmark3?: number | null;
  arithmark2?: number | null;
  links?: { card?: string };
}

const RANDOM_BASELINES = {
  hellaswag: 25,
  arc: 25,
  piqa: 50,
  arithmark3: 25,
};

const normChance = (v: number, chance: number) => ((v - chance) / (100 - chance)) * 100;

function getIntelligenceIndex(m: SlmEntry): number | null {
  const components: number[] = [];
  if (typeof m.hellaswag === 'number' && Number.isFinite(m.hellaswag)) {
    components.push(normChance(m.hellaswag, RANDOM_BASELINES.hellaswag));
  }
  const hasArc = typeof m.arc === 'number' && Number.isFinite(m.arc);
  const hasArcChall = typeof m.arcChall === 'number' && Number.isFinite(m.arcChall);
  if (hasArc || hasArcChall) {
    const arcScore = hasArc && hasArcChall ? (m.arc! + m.arcChall!) / 2 : hasArc ? m.arc! : m.arcChall!;
    components.push(normChance(arcScore, RANDOM_BASELINES.arc));
  }
  if (typeof m.piqa === 'number' && Number.isFinite(m.piqa)) {
    components.push(normChance(m.piqa, RANDOM_BASELINES.piqa));
  }
  const hasA3 = typeof m.arithmark3 === 'number' && Number.isFinite(m.arithmark3);
  if (components.length + (hasA3 ? 1 : 0) < 2) return null;
  const a3Weight = hasA3 ? 0.65 : 0;
  const sum = components.reduce((a, b) => a + b, 0) + (hasA3 ? normChance(m.arithmark3!, RANDOM_BASELINES.arithmark3) * a3Weight : 0);
  return +(sum / (components.length + a3Weight)).toFixed(2);
}

function getAvg(m: SlmEntry): number | null {
  const components: number[] = [];
  if (typeof m.hellaswag === 'number' && Number.isFinite(m.hellaswag)) components.push(m.hellaswag);
  const hasArc = typeof m.arc === 'number' && Number.isFinite(m.arc);
  const hasArcChall = typeof m.arcChall === 'number' && Number.isFinite(m.arcChall);
  if (hasArc && hasArcChall) components.push((m.arc! + m.arcChall!) / 2);
  else if (hasArc) components.push(m.arc!);
  else if (hasArcChall) components.push(m.arcChall!);
  const hasPiqa = typeof m.piqa === 'number' && Number.isFinite(m.piqa);
  const hasA3 = typeof m.arithmark3 === 'number' && Number.isFinite(m.arithmark3);
  const count = components.length + (hasPiqa ? 1 : 0) + (hasA3 ? 1 : 0);
  if (count < 2) return null;
  const sum = components.reduce((a, b) => a + b, 0) + (hasPiqa ? m.piqa! : 0) + (hasA3 ? m.arithmark3! : 0);
  return +(sum / count).toFixed(2);
}

function extractModelsArray(html: string): SlmEntry[] {
  const marker = 'const MODELS = [';
  const start = html.indexOf(marker);
  if (start < 0) throw new Error('Open SLM: MODELS array not found in index.html');
  const arrStart = html.indexOf('[', start);
  let depth = 0;
  let inStr: string | null = null;
  let escaped = false;
  let end = -1;
  for (let i = arrStart; i < html.length; i++) {
    const ch = html[i];
    if (inStr) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '/' && html[i + 1] === '/') {
      while (i < html.length && html[i] !== '\n') i++;
      continue;
    }
    if (ch === '/' && html[i + 1] === '*') {
      i += 2;
      while (i < html.length && !(html[i] === '*' && html[i + 1] === '/')) i++;
      i++;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') inStr = ch;
    else if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end < 0) throw new Error('Open SLM: unterminated MODELS array');
  return JSON.parse(jsLiteralToJson(html.slice(arrStart, end))) as SlmEntry[];
}

/** Pure-data converter for the static MODELS JS array literal (comments, single quotes, unquoted keys, trailing commas). */
function jsLiteralToJson(src: string): string {
  const out: string[] = [];
  let i = 0;
  const n = src.length;
  const isIdStart = (c: string) => /[A-Za-z_$]/.test(c);
  const isIdPart = (c: string) => /[A-Za-z0-9_$]/.test(c);
  while (i < n) {
    const ch = src[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === '/' && src[i + 1] === '/') {
      while (i < n && src[i] !== '\n') i++;
      continue;
    }
    if (ch === '/' && src[i + 1] === '*') {
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      const q = ch;
      let val = '';
      i++;
      while (i < n && src[i] !== q) {
        if (src[i] === '\\' && i + 1 < n) {
          const nxt = src[i + 1];
          if (nxt === 'n') val += '\n';
          else if (nxt === 'r') val += '\r';
          else if (nxt === 't') val += '\t';
          else val += nxt;
          i += 2;
        } else {
          val += src[i++];
        }
      }
      i++;
      out.push(JSON.stringify(val));
      continue;
    }
    if (ch === '[' || ch === ']' || ch === '{' || ch === '}' || ch === ':' || ch === ',') {
      if ((ch === ']' || ch === '}') && out.length && out[out.length - 1] === ',') out.pop();
      out.push(ch);
      i++;
      continue;
    }
    if (ch === '-' || ch === '.' || (ch >= '0' && ch <= '9')) {
      const start = i;
      if (src[i] === '-') i++;
      while (i < n && /[0-9_]/.test(src[i])) i++;
      if (src[i] === '.') {
        i++;
        while (i < n && /[0-9_]/.test(src[i])) i++;
      }
      if (src[i] === 'e' || src[i] === 'E') {
        i++;
        if (src[i] === '+' || src[i] === '-') i++;
        while (i < n && /[0-9_]/.test(src[i])) i++;
      }
      let numStr = src.slice(start, i).replace(/_/g, '');
      if (numStr.startsWith('.')) numStr = `0${numStr}`;
      else if (numStr.startsWith('-.')) numStr = `-0${numStr.slice(1)}`;
      out.push(numStr);
      continue;
    }
    if (isIdStart(ch)) {
      const start = i;
      while (i < n && isIdPart(src[i])) i++;
      const word = src.slice(start, i);
      let j = i;
      while (j < n && /\s/.test(src[j])) j++;
      if (src[j] === ':') {
        out.push(JSON.stringify(word));
      } else if (word === 'true' || word === 'false' || word === 'null') {
        out.push(word);
      } else if (word === 'undefined') {
        out.push('null');
      } else {
        throw new Error(`Open SLM: unexpected identifier "${word}" in MODELS literal`);
      }
      continue;
    }
    throw new Error(`Open SLM: unexpected character "${ch}" in MODELS literal`);
  }
  return out.join('');
}

const board: Leaderboard = {
  benchmark: 'open-slm-leaderboard',
  url: 'https://huggingface.co/spaces/AxiomicLabs/Open_SLM_Leaderboard',
  feed: FEED,
  terms: 'Public Hugging Face Space leaderboard published by Axiomic Labs.',
  parts: {
    hellaswag: { name: 'HellaSwag', unit: '%', better: 'higher' },
    arcEasy: { name: 'ARC-Easy', unit: '%', better: 'higher' },
    arcChallenge: { name: 'ARC-Challenge', unit: '%', better: 'higher' },
    piqa: { name: 'PIQA', unit: '%', better: 'higher' },
    arithmark3: { name: 'ArithMark-3', unit: '%', better: 'higher' },
    arithmark2: { name: 'ArithMark-2', unit: '%', better: 'higher' },
  },
  stats: {
    weightedAvg: { name: 'Weighted average', unit: '%', better: 'higher', note: 'Raw accuracy average across HellaSwag, combined ARC, PIQA, and ArithMark-3.' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(FEED);
    const models = extractModelsArray(html);
    const rows: LeaderboardRow[] = [];
    for (const m of models) {
      const score = getIntelligenceIndex(m);
      if (!m.name || score === null) continue;
      const metrics: Record<string, number> = {};
      if (typeof m.hellaswag === 'number' && Number.isFinite(m.hellaswag)) metrics.hellaswag = m.hellaswag;
      if (typeof m.arc === 'number' && Number.isFinite(m.arc)) metrics.arcEasy = m.arc;
      if (typeof m.arcChall === 'number' && Number.isFinite(m.arcChall)) metrics.arcChallenge = m.arcChall;
      if (typeof m.piqa === 'number' && Number.isFinite(m.piqa)) metrics.piqa = m.piqa;
      if (typeof m.arithmark3 === 'number' && Number.isFinite(m.arithmark3)) metrics.arithmark3 = m.arithmark3;
      if (typeof m.arithmark2 === 'number' && Number.isFinite(m.arithmark2)) metrics.arithmark2 = m.arithmark2;
      const avg = getAvg(m);
      if (avg !== null) metrics.weightedAvg = avg;

      const params = typeof m.params === 'number' && Number.isFinite(m.params) && m.params > 0 ? +(m.params / 1e9).toFixed(5) : undefined;
      const date = m.addedDate && /^\d{4}-\d{2}-\d{2}$/.test(m.addedDate) ? m.addedDate : undefined;
      const link = m.links?.card?.trim().replace(/&amp;/g, '&');
      const submitter = m.org?.trim() || undefined;

      rows.push({
        model: m.name.trim(),
        score,
        open: true,
        ...(params !== undefined ? { params } : {}),
        ...(date ? { date } : {}),
        ...(submitter ? { submitter } : {}),
        ...(link && /^https?:\/\/\S+$/.test(link) ? { link } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    return rows;
  },
};

export default board;
