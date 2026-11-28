// The /index/ page's payload on the server: the index (src/lib/almanac-index-data.ts) plus what the page needs to
// draw names, which the index leaves out: each lab's mark kind and whether it has a page, and the models that have
// one. /index/data.json serves the same object to the page script.
import { indexPage } from '../../lib/almanac-index-data.ts';
import { labById, labPages } from '../../lib/data.ts';
import { featuredIds } from '../../lib/routes.ts';
import { COLOR_MARKS, MONO_MARKS } from '../../lib/marks.ts';
import type { Extras, Payload } from './render.ts';

let cached: Payload | null = null;
export function indexPayload(): Payload {
  if (cached) return cached;
  const page = indexPage();
  const labs: Extras['labs'] = {};
  for (const [, lab, labName] of Object.values(page.models)) {
    if (!lab || labs[lab]) continue;
    labs[lab] = [labById.get(lab)?.name ?? labName ?? lab, COLOR_MARKS.has(lab) ? 'c' : MONO_MARKS.has(lab) ? 'm' : '', labPages.has(lab) ? 1 : 0];
  }
  const linked = Object.keys(page.models).filter((m) => featuredIds.has(m));
  cached = { ...page, labs, linked };
  return cached;
}
