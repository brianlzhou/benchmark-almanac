// The index behind the home page search box: every benchmark, model and lab, with the other spellings each
// goes by. Built once as a static file and fetched only when someone focuses the box.
import { benchmarks, models, labs, labById, featuredModels } from '../lib/data.ts';
import { CATEGORY_NAMES } from '../lib/taxonomy.ts';

// [name, url, kind, detail, other spellings]
type Row = [string, string, 'b' | 'm' | 'l', string, string];

export function GET() {
  const shown = new Set(featuredModels.map((m) => m.id));
  const rows: Row[] = [
    ...benchmarks.map((b): Row => [
      b.name,
      `/benchmarks/${b.id}/`,
      'b',
      [CATEGORY_NAMES[b.category ?? ''] ?? '', b.org ?? ''].filter(Boolean).join(', '),
      (b.aliases ?? []).join(' | '),
    ]),
    ...models
      .filter((m) => shown.has(m.id))
      .map((m): Row => [m.name, `/models/${m.id}/`, 'm', [labById.get(m.lab ?? '')?.name, m.released?.slice(0, 4)].filter(Boolean).join(', '), (m.aliases ?? []).join(' | ')]),
    ...labs.map((l): Row => [l.name, `/labs/${l.id}/`, 'l', '', (l.aliases ?? []).join(' | ')]),
  ];
  return new Response(JSON.stringify(rows), { headers: { 'content-type': 'application/json' } });
}
