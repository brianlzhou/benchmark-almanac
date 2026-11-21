// MathArena's measured competition results, including input tokens, average retries.
import type { LeaderboardRow } from '../../leaderboards/types.ts';
import { fetchJson } from '../util.ts';

export const matharenaFeed = (comp: string) => `https://matharena.ai/competition_tables/${comp}`;
const text = (s: string) =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/⚠️/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * One row per model in the competition's main table, with "Accuracy" as the score (0 to 100).
 * Rows marked data-predicted="yes" include item-response-theory estimates for unrun questions; they are skipped.
 */
export async function matharenaRows(comp: string): Promise<LeaderboardRow[]> {
  const { table } = await fetchJson<{ table: string }>(matharenaFeed(comp));
  const head = [...table.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((h) => text(h[1]));
  const timeCol = head.indexOf('Average Time');
  const rows: LeaderboardRow[] = [];
  for (const m of table.matchAll(/<tr class="model-row"([\s\S]*?)<\/tr>/g)) {
    const tr = m[1];
    const name = tr.match(/<a class="model-link"[^>]*>([\s\S]*?)<\/a>/);
    const acc = tr.match(/metric-bar-cell--accuracy[^>]*?data-predicted="(\w+)"[^>]*>([\s\S]*?)<\/td>/);
    if (!name || !acc) continue;
    if (acc[1] !== 'no') continue;
    const pct = text(acc[2]).match(/^(-?[\d.]+)%/);
    if (!pct) continue;
    // "Cost in USD for one model run on one problem" and "Average number of output tokens per answer"
    const cell = (kind: string) => {
      const c = tr.match(new RegExp(`metric-bar-cell--${kind}"[^>]*>([\\s\\S]*?)<\\/td>`));
      const v = c && text(c[1]).replace(/[$,]/g, '').match(/^[\d.]+/);
      return v ? Number(v[0]) : undefined;
    };
    let model = text(name[1]);
    let setting: string | undefined;
    let harness: string | undefined;
    // "GPT-5 (High) Agent": the model inside MathArena's agent scaffold
    if (/\sAgent$/.test(model)) {
      harness = 'MathArena agent';
      model = model.replace(/\s+Agent$/, '');
    }
    // "Kimi K3 (Think)": MathArena's label for thinking mode
    const think = model.match(/\s*\(Think\)$/i);
    if (think) {
      setting = 'thinking';
      model = model.slice(0, think.index);
    }
    const score = Number(pct[1]);
    const metrics: Record<string, number> = {};
    // "100.00% ± 0.00%": a 95% normal-approximation interval, kept within 0 to 100
    const ci = text(acc[2]).match(/±\s*([\d.]+)%/);
    if (ci) Object.assign(metrics, { ciLow: Math.max(0, +(score - Number(ci[1])).toFixed(2)), ciHigh: Math.min(100, +(score + Number(ci[1])).toFixed(2)) });
    // "Average time taken per answer", such as "1m 50s" or "118m 13s"; "—" when not recorded
    const tds = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => text(c[1]));
    const time = timeCol >= 0 && tds.length === head.length ? tds[timeCol].match(/^(?:(\d+)h\s*)?(?:(\d+)m\s*)?(?:(\d+(?:\.\d+)?)s)?$/) : null;
    if (time && time[0]) metrics.latency = 3600 * Number(time[1] ?? 0) + 60 * Number(time[2] ?? 0) + Number(time[3] ?? 0);
    const column = (label: string) => tds.length === head.length ? tds[head.indexOf(label)] : undefined;
    const parameterCount = (label: string) => {
      const value = column(label);
      return value && /^\d+(?:\.\d+)?$/.test(value) ? Number(value) : undefined;
    };
    for (const [label, key] of [['Input Tokens', 'inputTokens'], ['Average Retries', 'averageRetries']]) {
      const value = column(label)?.replace(/,/g, '');
      if (value && /^\d+(?:\.\d+)?$/.test(value)) metrics[key] = Number(value);
    }
    const activeParams = parameterCount('Active Parameters');
    if (activeParams !== undefined) metrics.activeParams = activeParams;
    const openMark = column('Open');
    const href = tr.match(/<a class="model-link"[^>]*href="([^"]+)"/)?.[1];
    rows.push({
      model,
      score,
      setting,
      harness,
      open: openMark?.includes('✔') ? true : openMark?.includes('❌') ? false : undefined,
      params: parameterCount('Parameters'),
      link: href?.startsWith('/models/') ? new URL(href, 'https://matharena.ai').href : undefined,
      low: ci ? +(score - Number(ci[1])).toFixed(2) : undefined,
      high: ci ? +(score + Number(ci[1])).toFixed(2) : undefined,
      cost: cell('cost'),
      tokens: cell('tokens'),
      metrics: Object.keys(metrics).length ? metrics : undefined,
    });
  }
  if (!rows.length) throw new Error(`no rows in ${comp}`);
  return rows;
}
