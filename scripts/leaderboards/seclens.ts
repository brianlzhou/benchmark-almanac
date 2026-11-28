// SecLens (MatterSec Labs): real-world CVE vulnerability detection benchmark across 35 security
// dimensions and 5 stakeholder lenses (CISO, CAIO, Security Researcher, Engineering, and AI Actor).
// Parses the inline `const MODELS = [...]` array in index.html purely as data (no eval), and
// includes the live Chart.js score-versus-cost scatter plot.
import { fetchText } from '../lib/util.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';

const SITE = 'https://mattersec-labs.github.io/seclens/';

interface SecLensModel {
  id?: string;
  name: string;
  leaderboard: number;
  ciso?: number;
  caio?: number;
  researcher?: number;
  engineering?: number;
  ai_actor?: number;
  cost?: number | null;
}

function jsLiteralToJson(src: string): string {
  const out: string[] = [];
  let i = 0;
  const n = src.length;
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
    if (ch === '"' || ch === "'") {
      const q = ch;
      let val = '';
      i++;
      while (i < n && src[i] !== q) {
        if (src[i] === '\\' && i + 1 < n) {
          val += src[i + 1];
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
      while (i < n && /[0-9.]/.test(src[i])) i++;
      let numStr = src.slice(start, i);
      if (numStr.startsWith('.')) numStr = `0${numStr}`;
      out.push(numStr);
      continue;
    }
    if (/[A-Za-z_$]/.test(ch)) {
      const start = i;
      while (i < n && /[A-Za-z0-9_$]/.test(src[i])) i++;
      const word = src.slice(start, i);
      let j = i;
      while (j < n && /\s/.test(src[j])) j++;
      if (src[j] === ':') out.push(JSON.stringify(word));
      else if (word === 'true' || word === 'false' || word === 'null') out.push(word);
      else throw new Error(`SecLens: unexpected token "${word}"`);
      continue;
    }
    throw new Error(`SecLens: unexpected char "${ch}"`);
  }
  return out.join('');
}

function extractModels(html: string): SecLensModel[] {
  const start = html.indexOf('const MODELS = [');
  if (start < 0) throw new Error('SecLens: MODELS array not found');
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
    if (ch === '"' || ch === "'") inStr = ch;
    else if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end < 0) throw new Error('SecLens: unterminated MODELS array');
  return JSON.parse(jsLiteralToJson(html.slice(arrStart, end))) as SecLensModel[];
}

const board: Leaderboard = {
  benchmark: 'seclens',
  url: SITE,
  feed: SITE,
  terms: 'Public research benchmark website published by MatterSec Labs.',
  chart: {
    title: 'Aggregate score versus cost per case',
    x: { key: 'cost', label: 'Cost per case', unit: '$', better: 'lower' },
    y: { key: 'score', label: 'Aggregate score', unit: '%', better: 'higher' },
    note: 'Matches the Chart.js cost-versus-score scatter plot on the SecLens leaderboard.',
  },
  parts: {
    ciso: { name: 'CISO lens', unit: 'score', better: 'higher' },
    caio: { name: 'CAIO lens', unit: 'score', better: 'higher' },
    researcher: { name: 'Security Researcher lens', unit: 'score', better: 'higher' },
    engineering: { name: 'Engineering lens', unit: 'score', better: 'higher' },
    aiActor: { name: 'AI Actor lens', unit: 'score', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(SITE);
    const models = extractModels(html);
    const rows: LeaderboardRow[] = [];
    for (const m of models) {
      if (!m.name || !Number.isFinite(m.leaderboard)) continue;
      const metrics: Record<string, number> = {};
      if (typeof m.ciso === 'number' && Number.isFinite(m.ciso)) metrics.ciso = m.ciso;
      if (typeof m.caio === 'number' && Number.isFinite(m.caio)) metrics.caio = m.caio;
      if (typeof m.researcher === 'number' && Number.isFinite(m.researcher)) metrics.researcher = m.researcher;
      if (typeof m.engineering === 'number' && Number.isFinite(m.engineering)) metrics.engineering = m.engineering;
      if (typeof m.ai_actor === 'number' && Number.isFinite(m.ai_actor)) metrics.aiActor = m.ai_actor;
      rows.push({
        model: m.name.trim(),
        score: m.leaderboard,
        ...(typeof m.cost === 'number' && Number.isFinite(m.cost) && m.cost > 0 ? { cost: m.cost } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }
    return rows;
  },
};

export default board;
