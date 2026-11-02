// Benchmark makers, split into the organizations they name, with a lab page where one of them is a lab we
// track. "Princeton NLP + OpenAI" is two makers, "Qwen Team, Alibaba Group" and "xAI (SpaceXAI)" are one lab.
import { labs } from './data.ts';

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
  // the separators inside "(…)" belong to the note, so only the text outside it is split
  const bare = org.replace(/\(.*?\)/g, '');
  if (!re.test(bare)) return [{ text: org, sep: '', lab: labOf(org) }];
  const out: MakerPart[] = [];
  const bits = org.split(re);
  for (let i = 0; i < bits.length; i += 2) out.push({ text: bits[i], sep: i ? bits[i - 1] : '', lab: labOf(bits[i]) });
  return out;
}
