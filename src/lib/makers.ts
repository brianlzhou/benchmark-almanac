// Benchmark makers, split into the organizations they name, with a lab page where one of them is a lab we
// track. "Princeton NLP + OpenAI" is two makers, "Qwen Team, Alibaba Group" and "xAI (SpaceXAI)" are one lab.
import { benchmarks, labs } from './data.ts';

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const LAB_BY_NAME = new Map<string, string>();
for (const l of labs) for (const n of [l.name, ...(l.aliases ?? [])]) if (norm(n)) LAB_BY_NAME.set(norm(n), l.id);

/** The lab an organization name belongs to: an exact name or alias, or a name that starts with one ("Google Research"). */
export function labOf(org: string): string | undefined {
  const n = norm(org);
  if (!n) return undefined;
  if (LAB_BY_NAME.has(n)) return LAB_BY_NAME.get(n);
  const words = n.split(' ');
  for (let k = words.length - 1; k >= 1; k--) {
    const id = LAB_BY_NAME.get(words.slice(0, k).join(' '));
    if (id) return id;
  }
  return undefined;
}

export interface MakerPart {
  text: string;
  sep: string;
  lab?: string;
}

/** The maker field as parts, each with its lab when it has one, and the separator that came before it. */
export function makerParts(org: string): MakerPart[] {
  const re = /(\s\+\s|,\s|\sand\s|\s&\s|\s\/\s)/;
  // "University of Science and Technology of China" is one name: its "and" is held out of the split
  const held = org.replace(KEEP_AND, `$1${HOLD}and${HOLD}$2`);
  const back = (s: string) => s.replaceAll(HOLD, ' ');
  // the separators inside "(…)" belong to the note, so only the text outside it is split
  const bare = held.replace(/\(.*?\)/g, '');
  if (!re.test(bare)) return [{ text: org, sep: '', lab: labOf(org) }];
  const out: MakerPart[] = [];
  const bits = held.split(re).map(back);
  for (let i = 0; i < bits.length; i += 2) out.push({ text: bits[i], sep: i ? bits[i - 1] : '', lab: labOf(bits[i]) });
  return out;
}
const HOLD = '⁣';
const KEEP_AND = /\b(Science|Sciences|Finance|Arts|Engineering|Research|Information) and (Technology|Economics|Engineering|Sciences?|Design|Development)\b/g;

// One page per organization that made two or more records. The id comes from the organization's name without its
// note in parentheses, so "MathArena (ETH Zurich SRI Lab)" and "MathArena (ETH Zurich SRI Lab and INSAIT)" share
// one, and a lab takes its lab id. "X with Y" counts toward X, the lead maker. SAME joins renames by hand.
const SAME: Record<string, string> = {
  // LMSYS ran Chatbot Arena, which became LMArena and then Arena
  lmsys: 'arena',
  lmarena: 'arena',
  // Arcada Labs runs Design Arena
  'arcada labs': 'designarena',
  'shanghai ai laboratory': 'shanghai-ai-lab',
};
// names the catalog writes with a note that a page title shouldn't drop or keep
const TITLE: Record<string, string> = { arena: 'Arena (formerly LMArena)', designarena: 'Design Arena' };
// words that name no organization: "OpenAI and collaborators", "Hendrycks et al."
const GENERIC = /^(?:collaborators|others|coauthors|co authors|contributors|partners|community)$|\bet al\b/;

/** The maker page id an organization name belongs to, or none for a name that isn't an organization. */
export function makerId(text: string): string | undefined {
  const lab = labOf(text);
  if (lab) return lab;
  // "A, B, and C" splits into "A", "B" and "and C"; an accent folds to its letter, so "Håvard" is "havard"
  const n = norm(text.normalize('NFKD').replace(/[\u0300-\u036f]/g, ''))
    .replace(/^and /, '')
    .replace(/ with .*$/, '');
  if (!n || GENERIC.test(n)) return undefined;
  return (SAME[n] ?? n).replace(/ /g, '-');
}

export interface Maker {
  id: string;
  /** The lab's name, or the spelling the catalog uses most for this maker. */
  name: string;
  lab?: string;
  /** Every record it made or helped make, in catalog order. */
  ids: string[];
}

const spellings = new Map<string, Map<string, number>>();
const made = new Map<string, string[]>();
for (const b of benchmarks) {
  for (const id of new Set(makerParts(b.org ?? '').map((p) => makerId(p.text)).filter((x): x is string => !!x))) made.set(id, [...(made.get(id) ?? []), b.id]);
  for (const p of makerParts(b.org ?? '')) {
    const id = makerId(p.text);
    if (!id) continue;
    const m = spellings.get(id) ?? new Map<string, number>();
    const text = p.text.replace(/^and /, '').replace(/\(.*?\)/g, '').replace(/ with .*$/, '').replace(/\s+/g, ' ').trim();
    m.set(text, (m.get(text) ?? 0) + 1);
    spellings.set(id, m);
  }
}
const labName = new Map(labs.map((l) => [l.id, l.name]));
/** Makers with a page: two or more records. */
export const makers = new Map<string, Maker>(
  [...made]
    .filter(([, ids]) => ids.length >= 2)
    .map(([id, ids]) => {
      const lab = labName.has(id) ? id : undefined;
      const name = TITLE[id] ?? (lab ? labName.get(id)! : [...spellings.get(id)!].sort((a, b) => b[1] - a[1] || a[0].length - b[0].length)[0][0]);
      return [id, { id, name, lab, ids }];
    }),
);

/** Where a maker's name links: its maker page, else its lab page, else undefined. */
export function makerHref(text: string): string | undefined {
  const id = makerId(text);
  if (id && makers.has(id)) return `/makers/${id}/`;
  const lab = labOf(text);
  return lab ? `/labs/${lab}/` : undefined;
}
