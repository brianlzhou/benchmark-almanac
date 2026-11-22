// Writes the "Data health" report: what the daily jobs found that needs a person. The sync posts it as one rolling
// GitHub issue, so nothing waits on someone remembering to run a script.
//   - boards whose importer failed, longest first (a board failing three days or more needs its importer fixed)
//   - fields boards publish that their importers may drop (data/scores/field-review.json, from the field watch)
//   - benchmarks the discovery job marked ready for the catalog, and possible audits of cataloged benchmarks
//   - links that stopped working (data/audits/link-health.json, when the link check has run)
// usage: node scripts/health-report.ts [out.md]
import { existsSync, writeFileSync } from 'node:fs';
import { dataPath, key, readJson, today } from './lib/util.ts';

const opt = <T>(path: string, fallback: T): T => (existsSync(path) ? readJson<T>(path) : fallback);
const days = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
const now = today();

type Board = { url?: string; retrieved?: string; failed?: { date: string; error: string } };
const lb = readJson<{ boards: Record<string, Board> }>(dataPath('scores', 'leaderboards.json'));
const failing = Object.entries(lb.boards)
  .filter(([, b]) => b.failed)
  .map(([id, b]) => ({ id, since: b.retrieved ?? '', error: b.failed!.error, url: b.url ?? '' }))
  .sort((a, b) => a.since.localeCompare(b.since));

const review = opt<{ boards: Record<string, { field: string; kind: string; why: string }[]> }>(dataPath('scores', 'field-review.json'), { boards: {} }).boards;
const flagged = Object.entries(review).sort((a, b) => b[1].length - a[1].length);
const kinds = new Map<string, number>();
for (const [, fs] of flagged) for (const f of fs) kinds.set(f.kind, (kinds.get(f.kind) ?? 0) + 1);

// a find stays in the discovery queue after someone catalogs it, so leave out the ones whose paper, repo or page a
// cataloged benchmark already links
const norm = (u: string) => u.toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '');
const catalog = readJson<{ name: string; links?: Record<string, string>; evidence?: string[] }[]>(dataPath('benchmarks.json'));
const catalogLinks = catalog.flatMap((b) => [...Object.values(b.links ?? {}), ...(b.evidence ?? [])]);
const names = new Set(catalog.map((b) => key(b.name)));
const linked = new Set(catalogLinks.map(norm));
const arxivIds = new Set(catalogLinks.flatMap((u) => u.match(/\d{4}\.\d{4,5}/g) ?? []));
const cataloged = (x: { name: string; url: string; repo?: string; arxiv?: string }) => names.has(key(x.name)) || (x.arxiv && arxivIds.has(x.arxiv)) || [x.url, x.repo].some((u) => u && linked.has(norm(u)));
const found = opt<{ items: { name: string; url: string; repo?: string; arxiv?: string; decision?: string }[] }>(dataPath('discovered.json'), { items: [] }).items.filter((x) => x.decision === 'catalog' && !cataloged(x));
const audits = opt<{ items: { title: string; url: string }[] }>(dataPath('discovered-audits.json'), { items: [] }).items;
const links = opt<{ results: Record<string, { ok: boolean; status?: number; note?: string }> }>(dataPath('audits', 'link-health.json'), { results: {} }).results;
const broken = Object.entries(links).filter(([, r]) => r.ok === false && r.status !== 403 && r.status !== 429);

const out: string[] = [];
out.push(`This issue is rewritten by the daily sync. Last update: ${now}.`, '');
out.push(`## Importers that failed (${failing.length})`, '');
if (!failing.length) out.push('Every board read cleanly.', '');
else {
  out.push('A board keeps its last rows when its importer fails. One failing for three days or more needs a fix in `scripts/leaderboards/`. After seven days its page says the scores are no longer updated automatically.', '');
  out.push('| Board | Last good read | Days | Error |', '|---|---|---|---|');
  for (const f of failing) out.push(`| [${f.id}](${f.url}) | ${f.since || 'never'} | ${f.since ? days(f.since, now) : ''} | ${f.error.replace(/\|/g, '/').slice(0, 120)} |`);
  out.push('');
}
out.push(`## Fields boards publish that importers may drop (${flagged.length} boards)`, '');
if (!flagged.length) out.push('Nothing flagged, or the field watch has not run yet.', '');
else {
  out.push(`By kind: ${[...kinds].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ')}. Full list: \`data/scores/field-review.json\`. Wire a field into its importer, or mark it reviewed in \`data/field-decisions.json\`.`, '');
  for (const [id, fs] of flagged.slice(0, 25)) out.push(`- **${id}**: ${fs.map((f) => `\`${f.field}\` (${f.kind}${f.why === 'new' ? ', new' : ''})`).join(', ')}`);
  if (flagged.length > 25) out.push(`- and ${flagged.length - 25} more boards`);
  out.push('');
}
out.push(`## Ready for the catalog (${found.length})`, '');
out.push(found.length ? found.map((x) => `- [${x.name}](${x.url})`).join('\n') : 'Nothing waiting.', '');
out.push(`## Possible audits of cataloged benchmarks (${audits.length})`, '');
out.push(audits.length ? audits.slice(0, 15).map((x) => `- [${x.title.slice(0, 110)}](${x.url})`).join('\n') : 'Nothing waiting.', '');
if (Object.keys(links).length) {
  out.push(`## Broken links (${broken.length} of ${Object.keys(links).length} checked)`, '');
  out.push(broken.length ? broken.slice(0, 40).map(([u, r]) => `- ${u} (${r.status ?? r.note ?? 'no response'})`).join('\n') : 'Every link answered.', '');
}
const text = out.join('\n');
const path = process.argv[2];
if (path) writeFileSync(path, text + '\n');
else console.log(text);
