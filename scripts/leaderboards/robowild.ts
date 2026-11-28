// RoboWild (XLANG Lab): robot-use agent evaluation across 341 Isaac Lab simulation tasks.
// Reads the live Vite bundle referenced from https://robowild.xlang.ai (main-*.js -> Home-*.js),
// extracting the harnesses[].results array with weighted success (%), action count, output tokens,
// per-task and total USD cost, success count, and wall-clock hours per thinking setting.
import { fetchText } from '../lib/util.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';

const SITE = 'https://robowild.xlang.ai';

interface RoboWildResult {
  model: string;
  thinking?: string;
  fullSuccess: number;
  successCount?: number;
  actions?: number;
  outputTokens?: number;
  wallTimeHours?: number;
  cost?: number;
  totalCost?: number;
}

interface RoboWildHarness {
  id: string;
  name: string;
  placeholder?: boolean;
  results?: RoboWildResult[];
}

function extractHarnessesBlock(js: string): RoboWildHarness[] {
  const marker = 'harnesses:[';
  const start = js.indexOf(marker);
  if (start < 0) throw new Error('RoboWild: harnesses array not found in Home bundle');
  const arrStart = start + marker.length - 1;
  let depth = 0;
  let inStr: string | null = null;
  let escaped = false;
  let end = -1;
  for (let i = arrStart; i < js.length; i++) {
    const ch = js[i];
    if (inStr) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === inStr) {
        inStr = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inStr = ch;
    } else if (ch === '[') {
      depth++;
    } else if (ch === ']') {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end < 0) throw new Error('RoboWild: unterminated harnesses array in Home bundle');
  return JSON.parse(jsLiteralToJson(js.slice(arrStart, end))) as RoboWildHarness[];
}

/** Pure-data converter for the static Vite JS array literal (backtick/single strings, !0/!1, unquoted keys, .4, 226e4). */
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
      i++; // closing quote
      out.push(JSON.stringify(val));
      continue;
    }
    if (ch === '!' && (src[i + 1] === '0' || src[i + 1] === '1')) {
      out.push(src[i + 1] === '0' ? 'true' : 'false');
      i += 2;
      continue;
    }
    if (ch === '[' || ch === ']' || ch === '{' || ch === '}' || ch === ':' || ch === ',') {
      if ((ch === ']' || ch === '}') && out.length && out[out.length - 1] === ',') out.pop();
      out.push(ch);
      i++;
      continue;
    }
    if (ch === '-' || ch === '.' || (ch >= '0' && ch <= '9')) {
      let start = i;
      if (src[i] === '-') i++;
      while (i < n && /[0-9]/.test(src[i])) i++;
      if (src[i] === '.') {
        i++;
        while (i < n && /[0-9]/.test(src[i])) i++;
      }
      if (src[i] === 'e' || src[i] === 'E') {
        i++;
        if (src[i] === '+' || src[i] === '-') i++;
        while (i < n && /[0-9]/.test(src[i])) i++;
      }
      let numStr = src.slice(start, i);
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
        throw new Error(`RoboWild: unexpected identifier "${word}" in harnesses literal`);
      }
      continue;
    }
    throw new Error(`RoboWild: unexpected character "${ch}" in harnesses literal`);
  }
  return out.join('');
}

const board: Leaderboard = {
  benchmark: 'robowild',
  url: SITE,
  feed: SITE,
  terms: 'Public research benchmark website published by XLANG Lab.',
  reference: ['ReAct'],
  chart: {
    title: 'Weighted success versus output tokens',
    x: { key: 'tokens', label: 'Average output tokens per task', better: 'lower' },
    y: { key: 'score', label: 'Weighted success', unit: '%', better: 'higher' },
    note: 'Default tradeoff chart on the RoboWild site across thinking settings (the site also toggles to average cost per task).',
  },
  stats: {
    actions: { name: 'Average actions', unit: 'count', better: 'lower', note: 'Average number of robot control actions per task.' },
    successCount: { name: 'Completed tasks', unit: 'count', better: 'higher', note: 'Number of fully succeeded tasks out of 341.' },
    wallTimeHours: { name: 'Wall time', unit: 'hours', better: 'lower', note: 'Total wall-clock hours for the evaluation run.' },
    totalCost: { name: 'Total run cost', unit: 'usd', better: 'lower', note: 'Total API spend across all 341 Isaac Lab tasks.' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(SITE);
    const mainPath = html.match(/src="(\/assets\/main-[^"]+\.js)"/)?.[1];
    if (!mainPath) throw new Error('RoboWild: main bundle path not found');
    const mainJs = await fetchText(`${SITE}${mainPath}`);
    const homeFile = mainJs.match(/Home-[A-Za-z0-9_-]+\.js/)?.[0];
    if (!homeFile) throw new Error('RoboWild: Home bundle reference not found');
    const homeJs = await fetchText(`${SITE}/assets/${homeFile}`);
    const harnesses = extractHarnessesBlock(homeJs);
    const rows: LeaderboardRow[] = [];
    for (const h of harnesses) {
      if (h.placeholder || !Array.isArray(h.results)) continue;
      for (const r of h.results) {
        if (!r.model || !Number.isFinite(r.fullSuccess)) continue;
        const metrics: Record<string, number> = {};
        if (typeof r.actions === 'number' && Number.isFinite(r.actions)) metrics.actions = r.actions;
        if (typeof r.successCount === 'number' && Number.isFinite(r.successCount)) metrics.successCount = r.successCount;
        if (typeof r.wallTimeHours === 'number' && Number.isFinite(r.wallTimeHours)) metrics.wallTimeHours = r.wallTimeHours;
        if (typeof r.totalCost === 'number' && Number.isFinite(r.totalCost)) metrics.totalCost = r.totalCost;
        rows.push({
          model: r.model,
          score: r.fullSuccess,
          ...(r.thinking ? { setting: r.thinking } : {}),
          ...(h.name ? { harness: h.name } : {}),
          ...(typeof r.cost === 'number' && Number.isFinite(r.cost) ? { cost: r.cost } : {}),
          ...(typeof r.outputTokens === 'number' && Number.isFinite(r.outputTokens) ? { tokens: r.outputTokens } : {}),
          ...(Object.keys(metrics).length ? { metrics } : {}),
        });
      }
    }
    return rows;
  },
};

export default board;
