// Adds source scenario token counts to owned mean-win-rate boards. No token aggregate is invented.
import { fetchJson } from '../util.ts';
import { HELM_BUCKET, helmNewest, helmRows, type HelmTable } from '../../leaderboards/helm-capabilities.ts';
export async function helmWithScenarioTokens(table: HelmTable) {
  const rows = await helmRows(table);
  const path = await helmNewest(table.project, table.kind);
  const all = await fetchJson<any[]>(`${HELM_BUCKET}/${path}groups/${table.group}.json`);
  const accuracy = all.find(t => t.title === table.table);
  const general = all.find(t => t.title === 'General information');
  const scoreColumn = accuracy?.header.findIndex((h: any) => h.value === table.column);
  const source = accuracy?.rows.filter((r: any[]) => typeof r[scoreColumn]?.value === 'number' && Number.isFinite(r[scoreColumn].value));
  if (!general || source?.length !== rows.length) throw new Error('HELM ancillary table alignment changed');
  const byName = new Map(general.rows.map((r: any[]) => [r[0].value, r]));
  const columns = general.header.map((h: any, i: number) => ({name:h.value,i})).filter((h: any) => h.name.endsWith(' - # output tokens'));
  return rows.map((r, i) => {
    const cells = byName.get(source[i][0].value) as any[] | undefined;
    if (r.score !== source[i][scoreColumn].value * (table.scale ?? 1)) throw new Error('HELM score alignment changed');
    const metrics: Record<string, number> = {...r.metrics};
    for (const c of columns) {
      const v = cells?.[c.i]?.value;
      if (typeof v === 'number' && Number.isFinite(v)) metrics[c.name.replace(' - # output tokens',' output tokens')] = v;
    }
    return {...r, metrics};
  });
}
