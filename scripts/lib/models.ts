// Maps the names outside sources give models ("opus-5.5-max", "anthropic/claude-opus-4-20250514",
// "GPT-6 Astra (xhigh)") to ids in data/models.json, and splits off the setting (reasoning effort).
import { dataPath, readJson, key } from './util.ts';

interface Model {
  id: string;
  name: string;
  version?: string;
  released?: string;
  aliases?: string[];
  epoch?: string;
}

const EFFORT = ['max', 'xhigh', 'high', 'medium', 'low', 'minimal', 'none', 'thinking', 'non-thinking', 'nothinking', 'reasoning', 'adaptive'];
const EFFORT_RE = new RegExp(`(?:[\\s_-]|\\b)(${EFFORT.join('|')})(?:[\\s_-]?(?:reasoning|effort|mode))?$`, 'i');
// brand words people drop: "Opus 5.5" for "Claude Opus 5.5"
const DROPPABLE = /^(claude|meta|google|openai|anthropic|xai|mistral|alibaba)[\s-]+/i;

export interface Resolved {
  id: string;
  setting?: string;
}

export function makeResolver(extra: Record<string, string> = {}) {
  const models = readJson<Model[]>(dataPath('models.json'));
  const byKey = new Map<string, Model[]>();
  const add = (name: string, m: Model) => {
    const k = key(name);
    if (!k) return;
    const list = byKey.get(k) ?? [];
    if (!list.includes(m)) list.push(m);
    byKey.set(k, list);
  };
  for (const m of models) {
    const names = [m.name, m.id, ...(m.aliases ?? []), ...(m.epoch ? [m.epoch] : [])];
    if (m.version) names.push(`${m.name} (${m.version})`);
    for (const n of names) {
      add(n, m);
      if (DROPPABLE.test(n)) add(n.replace(DROPPABLE, ''), m);
    }
  }
  const extraKeys = new Map(Object.entries(extra).map(([n, id]) => [key(n), id]));

  // several snapshots share a base name ("GPT-4o"): take the newest released by the run date
  const pick = (list: Model[], date?: string): Model => {
    const dated = list.filter((m) => m.released).sort((a, b) => a.released!.localeCompare(b.released!));
    if (!dated.length) return list[0];
    const before = date ? dated.filter((m) => m.released! <= date) : dated;
    return (before.length ? before : dated).at(-1)!;
  };

  return function resolve(raw: string, date?: string): Resolved | null {
    const direct = extraKeys.get(key(raw));
    if (direct) return { id: direct };
    let name = raw.trim().replace(/^[\w.-]+\//, ''); // vendor prefix: "anthropic/claude-..."
    let setting: string | undefined;
    const paren = name.match(/\s*\(([^)]*)\)\s*$/);
    if (paren) {
      const inner = paren[1].trim();
      if (EFFORT.some((e) => inner.toLowerCase().startsWith(e)) || /reasoning|effort|thinking/i.test(inner)) {
        setting = inner.replace(/\s*(reasoning|effort)$/i, '').toLowerCase();
        name = name.slice(0, paren.index).trim();
      }
    }
    name = name.replace(/[-_ ]?(20\d\d-?\d\d-?\d\d)$/, ''); // date stamp
    const tries: { t: string; setting?: string }[] = [{ t: name, setting }];
    const eff = name.match(EFFORT_RE);
    if (eff && !setting) tries.push({ t: name.slice(0, eff.index).replace(/[-_ ]+$/, ''), setting: eff[1].toLowerCase() });
    // release tags people append: "-preview", "-latest", "-exp-02-05"
    for (const x of [...tries]) {
      const bare = x.t.replace(/[-_ ](preview|latest|exp|experimental)([-_ ]?[\d-]+)?$/i, '');
      if (bare !== x.t) tries.push({ t: bare, setting: x.setting });
    }
    for (const x of tries) {
      const hit = extraKeys.get(key(x.t));
      if (hit) return { id: hit, setting: x.setting };
      const list = byKey.get(key(x.t));
      if (list?.length) return { id: pick(list, date).id, setting: x.setting };
    }
    return null;
  };
}
