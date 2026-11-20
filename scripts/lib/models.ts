// Maps the names outside sources give models ("opus-5.5-max", "anthropic/claude-opus-4-20250514",
// "GPT-6 Astra (xhigh)") to ids in data/models.json, and splits off the setting (reasoning effort).
import { dataPath, readJson, key } from './util.ts';

interface Model {
  id: string;
  name: string;
  version?: string;
  released?: string;
  aliases?: string[];
  /** Names that mean this model at one setting ("GLM-5.3 Prime": "prime"), for modes a name carries in its words. */
  settingAliases?: Record<string, string>;
  epoch?: string;
}

const EFFORT = ['max', 'xhigh', 'high', 'medium', 'low', 'minimal', 'none', 'thinking', 'non-thinking', 'nothinking', 'non-reasoning', 'reasoning', 'adaptive'];
const EFFORT_RE = new RegExp(`(?:[\\s_-]|\\b)(${EFFORT.join('|')})(?:[\\s_-]?(?:reasoning|effort|mode))?$`, 'i');
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
// brand words people drop: "Opus 5.5" for "Claude Opus 5.5"
const DROPPABLE = /^(claude|meta|google|openai|anthropic|xai|mistral|alibaba)[\s-]+/i;
// a maker's name that sources put before a model's own. Qwen, DeepSeek and MiniMax name their models after
// themselves, so their word drops only when it comes twice ("Qwen Qwen3.7").
const MAKER = /^(?:openai|google(?:[\s_-]+deepmind)?|anthropic|meta(?:[\s_-]+ai)?|xai|x\.ai|alibaba(?:[\s_-]+cloud)?|moonshot(?:[\s_-]*ai)?|z\.ai|zhipu(?:[\s_-]+ai)?|(?:qwen|deepseek|minimax)(?=[\s_-]+(?:qwen|deepseek|minimax)))[\s_-]+(?=\S)/i;

export interface Resolved {
  id: string;
  setting?: string;
  /** The setting is part of the model's name ("GLM-5.3 Prime"), so it joins a board's own setting rather than giving way to it. */
  variant?: true;
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
  // names that carry a setting in their words: the model and the setting together
  const withSetting = new Map<string, Resolved>();
  for (const m of models) for (const [n, setting] of Object.entries(m.settingAliases ?? {})) if (key(n)) withSetting.set(key(n), { id: m.id, setting, variant: true });
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
    const named = withSetting.get(key(raw)) ?? withSetting.get(key(raw.trim().replace(/^[\w.-]+\//, '')));
    if (named) return { ...named };
    let name = raw.trim().replace(/^[\w.-]+\//, ''); // vendor prefix: "anthropic/claude-..."
    let setting: string | undefined;
    const paren = name.match(/\s*\(([^)]*)\)\s*$/);
    if (paren) {
      const inner = paren[1].trim();
      // a release tag in parentheses, as "(Preview)" or "(Nov '25 Preview)": dropped like a "-preview" suffix. Its month
      // names the snapshot, so it picks among snapshots the way a date stamp does.
      const tag = inner.match(/^(?:([a-z]{3})[a-z]*\.? '?(\d\d)'? )?(preview|exp|experimental)$/i);
      if (tag) {
        name = name.slice(0, paren.index).trim();
        const mon = tag[1] ? MONTHS.indexOf(tag[1].toLowerCase()) + 1 : 0;
        if (mon) date = `20${tag[2]}-${String(mon).padStart(2, '0')}-31`;
      } else if (EFFORT.some((e) => inner.toLowerCase().startsWith(e)) || /reasoning|effort|thinking|^default$/i.test(inner)) {
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
    // Claude's tier and version in either order: "Claude Sonnet 3.7" for "Claude 3.7 Sonnet", "Claude 4.5 Sonnet" for
    // "Claude Sonnet 4.5". Anthropic used the first order up to 3.7 and the second from 4 on, and sources mix them.
    for (const x of [...tries]) {
      const m = x.t.match(/^(claude)[\s_-]+(?:(opus|sonnet|haiku)[\s_-]+(\d+(?:[.-]\d)?)|(\d+(?:[.-]\d)?)[\s_-]+(opus|sonnet|haiku))$/i);
      if (m) tries.push({ t: m[2] ? `${m[1]} ${m[3]} ${m[2]}` : `${m[1]} ${m[5]} ${m[4]}`, setting: x.setting });
    }
    for (const x of tries) {
      const hit = extraKeys.get(key(x.t));
      if (hit) return { id: hit, setting: x.setting };
      const list = byKey.get(key(x.t));
      if (list?.length) return { id: pick(list, date).id, setting: x.setting };
    }
    // the maker's name before the model's own: "OpenAI o3", "Moonshot AI Kimi K2.7 Code", "Qwen Qwen3.7". Tried only
    // after the whole name fails, so "DeepSeek V4" never loses its brand word.
    const bare = raw.trim().replace(/^[\w.-]+\//, '').replace(MAKER, '');
    if (bare !== raw.trim().replace(/^[\w.-]+\//, '') && key(bare)) return resolve(bare, date);
    return null;
  };
}
