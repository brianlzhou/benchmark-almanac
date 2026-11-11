// Readers for arXiv paper tables. ArXiv sometimes nests small header tables inside data tables.
import { tables, num } from '../html.ts';
import { fetchText } from '../util.ts';
import type { LeaderboardRow } from '../../leaderboards/types.ts';

export async function paperTables(url: string) {
  let depth = 0;
  const html = (await fetchText(url)).replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '').replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi, '').replace(/<\/?table\b[^>]*>/gi, tag => {
    if (tag.startsWith('</')) return --depth === 0 ? tag : '';
    return ++depth === 1 ? tag : '';
  });
  return tables(html);
}
export function paperModel(raw: string): string {
  let model = raw.replace(/\s*\[\s*\d+(?:\s*,\s*\d+)*\s*\]/g, '').replace(/\s*\(Ours\)/gi, '').trim();
  if (/^(gpt[- ]?3[.]5(?:[- ]?turbo)?|gpt[- ]?4o(?:[- ]?mini)?|gpt4-o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?(?:pro|flash)|gemini-pro|gemini pro|gemini-flash-1.5|claude[- ]?(?:3[.]5[- ]?sonnet|sonnet[- ]?3[.]5)|deepseek[- ]?(?:v3|r1)|mistral[- ]large)$/i.test(model)) model += ' (snapshot unspecified)';
  return model;
}
export async function paperRows(url: string, cfg: {
  table: number; header: string; score: number; model?: number; width?: number; min: number;
  skip?: string; metrics?: Record<string, number>; setting?: string; factor?: number;
}): Promise<LeaderboardRow[]> {
  const ts = await paperTables(url);
  const t = ts[cfg.table];
  if (!t || !t.slice(0, 12).some(r => r.some(c => c.text.includes(cfg.header)))) throw new Error(`paper table changed: ${cfg.header}`);
  const rows: LeaderboardRow[] = [];
  for (const r of t) {
    if (cfg.width && r.length !== cfg.width) continue;
    const raw = r[cfg.model ?? 0]?.text ?? '';
    const score = num(r[cfg.score]?.text);
    if (!raw || score === undefined || /^(Human|Random|Average|Model|Method|Dataset|Overall|Total)\b/i.test(raw) || /^Avg[.]$/.test(raw) || (cfg.skip && new RegExp(cfg.skip).test(raw))) continue;
    const metrics: Record<string, number> = {};
    for (const [k, i] of Object.entries(cfg.metrics ?? {})) {const v = num(r[i]?.text); if (v !== undefined) metrics[k] = v;}
    rows.push({model: paperModel(raw), score: score * (cfg.factor ?? 1), ...(cfg.setting ? {setting: cfg.setting} : {}), ...(Object.keys(metrics).length ? {metrics} : {})});
  }
  if (rows.length < cfg.min) throw new Error(`paper returned only ${rows.length} rows, expected at least ${cfg.min}`);
  return rows;
}
