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

const EFFORT = ['max', 'xhigh', 'high', 'medium', 'low', 'minimal', 'none', 'thinking', 'non-thinking', 'nothinking', 'non-reasoning', 'reasoning', 'adaptive'];
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
  // an importer's own aliases. One that points at a model we do not have is dropped, so it cannot write rows
  // for a nonexistent id. A name with no ASCII letters or digits ("π₀.₅") keys to "" and is never looked up.
  const ids = new Set(models.map((m) => m.id));
  const extraKeys = new Map<string, string>();
  for (const [n, id] of Object.entries(extra)) {
    if (!ids.has(id)) console.log(`    alias "${n}" points at unknown model ${id}, skipped`);
    else if (key(n)) extraKeys.set(key(n), id);
  }

  // several snapshots share a base name ("GPT-4o"): take the newest released by the date. With no snapshot
  // out by then, the date is earlier than every release we know, so the earliest snapshot is the closest.
  const pick = (list: Model[], date?: string): Model => {
    const dated = list.filter((m) => m.released).sort((a, b) => a.released!.localeCompare(b.released!));
    if (!dated.length) return list[0];
    if (!date) return dated.at(-1)!;
    const before = dated.filter((m) => m.released! <= date);
    return before.length ? before.at(-1)! : dated[0];
  };

  return function resolve(raw: string, date?: string): Resolved | null {
    if (!key(raw)) return null;
    const direct = extraKeys.get(key(raw));
    if (direct) return { id: direct };
    let name = raw.trim().replace(/^[\w.-]+\//, ''); // vendor prefix: "anthropic/claude-..."
    let setting: string | undefined;
    const paren = name.match(/\s*\(([^)]*)\)\s*$/);
    if (paren) {
      const inner = paren[1].trim();
      if (EFFORT.some((e) => inner.toLowerCase().startsWith(e)) || /reasoning|effort|thinking/i.test(inner)) {
        // "High reasoning" -> "high", but "Non-Reasoning" and "No reasoning" keep the whole label
        setting = (/^(non|no)\b/i.test(inner) ? inner : inner.replace(/\s+(reasoning|effort)$/i, '')).toLowerCase();
        name = name.slice(0, paren.index).trim();
      }
    }
    // a date stamp ("gpt-4o-2024-05-13") names the snapshot: the full name may be an alias, and otherwise the
    // stamp, not the run date, picks among snapshots that share the base name
    const stamp = name.match(/[-_ ]?(20\d\d)-?(\d\d)-?(\d\d)$/);
    const tries: { t: string; setting?: string }[] = [];
    if (stamp) {
      tries.push({ t: name, setting });
      name = name.slice(0, stamp.index);
      date = `${stamp[1]}-${stamp[2]}-${stamp[3]}`;
    }
    tries.push({ t: name, setting });
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
