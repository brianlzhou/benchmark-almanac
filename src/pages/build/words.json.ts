// What the Build an index picker needs besides the vectors: for each benchmark in the builder, in the order of
// /build/matrix.json, its family (versions fold into one pick) and a word index over its description, note and
// paper abstract (src/lib/meaning-rank.ts). The page loads it only when a reader describes what they care about.
import abstractsJson from '../../../data/abstracts.json';
import { buildPayload } from '../../lib/build-data.ts';
import { benchById } from '../../lib/data.ts';
import { buildLexicon, familyKey, wordText } from '../../lib/meaning-rank.ts';
import type { PaperAbstract } from '../../lib/types.ts';

const abstracts = abstractsJson as Record<string, PaperAbstract>;

export function GET() {
  const ids = buildPayload().benches.map((b) => b[0]);
  const lex = buildLexicon(ids.map((id) => wordText(benchById.get(id) ?? {}, abstracts[id]?.text)));
  const fam = ids.map((id) => familyKey(id, (x) => benchById.get(x)));
  return new Response(JSON.stringify({ v: 1, fam, ...lex }), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
