// Readers for Scale AI's leaderboards on labs.scale.com. Each board page ships its rows as JSON inside the
// Next.js flight data (self.__next_f.push): one "entries" array, or "variants" (the page's tabs) that each hold
// one, with "activeTab" naming the tab the page opens on. Every entry is {model, version, rank, score, createdAt,
// deprecated, ...}. No board gives a cost or token count. createdAt is when Scale's CMS made the row, not the run
// date: whole boards share one stamp (2025-03-05 for the site move, 2026-10-07 for MultiChallenge's rebuild).
// The page draws deprecated entries grayed out and hides entries named "Unknown model". The "±" after a score
// (confidenceInterval_upper, a half-width) becomes the run's interval, metrics.ciLow and ciHigh.
import type { LeaderboardRow } from '../leaderboards/types.ts';
import { fetchText } from './util.ts';
import { nextFlight, jsonAt } from './html.ts';

export const SCALE_TERMS =
  "Public leaderboard pages on labs.scale.com, which robots.txt allows. Scale's website terms (August 2021) license use of the site through supported browsers for internal purposes.";

export const scaleUrl = (slug: string) => `https://labs.scale.com/leaderboard/${slug}`;

/**
 * Names that recur across Scale's boards and that the shared resolver cannot place, or places on the wrong
 * snapshot when no run date is given. Importers spread this into their own aliases. Names are as scaleName
 * leaves them (effort and harness split off, "p" read as a point).
 */
export const SCALE_ALIASES: Record<string, string> = {
  // older boards label snapshots by month
  'o1 (December 2024)': 'o1',
  'o1 Pro (March 2025)': 'o1-pro',
  'o3 (April 2025)': 'o3',
  'o3 Pro (June 2025)': 'o3-pro',
  'o4-mini (April 2025)': 'o4-mini',
  'GPT-4o (August 2024)': 'gpt-4o-aug-2024',
  'GPT-4o (November 2024)': 'gpt-4o-nov-2024',
  // the version field says gpt-4-1106-preview: GPT-4 Turbo from November 2023
  'GPT-4 (November 2024)': 'gpt-4-turbo-nov-2023',
  'GPT-4.5 Preview (February 2025)': 'gpt-4-5',
  'Claude 3.5 Sonnet (June 2024)': 'claude-3-5-sonnet',
  'Claude 3.7 Sonnet (February 2025)': 'claude-3-7-sonnet',
  'Claude 3.7 Sonnet (Feb 2025)': 'claude-3-7-sonnet',
  'Gemini 2.5 Pro Experimental (March 2025)': 'gemini-2-5-pro-mar-2025',
  'Gemini 2.5 Pro Preview (May 06 2025)': 'gemini-2-5-pro-may-2025',
  'Gemini 2.5 Flash Preview (May 2025)': 'gemini-2-5-flash-may-2025',
  'Gemini 2.5 Flash (April 2025)': 'gemini-2-5-flash-apr-2025',
  'Gemini 2.0 Flash Thinking (January 2025)': 'gemini-2-0-flash-thinking-jan-2025',
  'Gemini 2.0 Flash Thinking Experimental (January 2025)': 'gemini-2-0-flash-thinking-jan-2025',
  'Gemini 2.0 Pro Experimental (February 2025)': 'gemini-2-0-pro',
  'Gemini 2.0 Pro Experimental (Feb 2025)': 'gemini-2-0-pro',
  'Gemini 2.0 Flash (February 2025)': 'gemini-2-0-flash-feb-2025',
  'Gemini 2.0 Flash Experimental (December 2024)': 'gemini-2-0-flash-dec-2024',
  'Gemini 2.0 Flash Lite Preview (February 2025)': 'gemini-2-0-flash-lite',
  // gemini-1.5-pro-preview-0409, the first public API release of Gemini 1.5 Pro
  'Gemini 1.5 Pro (April 2024)': 'gemini-1-5-pro-feb-2024',
  'Gemini 1.5 Flash 002': 'gemini-1-5-flash-sep-2024',
  'DeepSeek-V3 (December 2024)': 'deepseek-v3',
  'DeepSeek V3 (March 2025)': 'deepseek-v3-mar-2025',
  // the January 2025 R1: boards list the May 2025 one as "R1-0528"
  'DeepSeek R1': 'deepseek-r1',
  // the version field says mistral-large-2407
  'Mistral Large 2': 'mistral-large-2-jul-2024',
  'Llama 3.1 405B Instruct': 'llama-3-1-405b',
  'Llama 3.1 70B Instruct': 'llama-3-1-70b',
  'Llama 3.1 8B Instruct': 'llama-3-1-8b',
  'Llama 3 70B Instruct': 'llama-3-70b',
  'llama4-maverick-17b-instruct': 'llama-4-maverick',
  'llama4-maverick-instruct-basic': 'llama-4-maverick',
  'Nova Pro': 'amazon-nova-pro',
  'Nova Lite': 'amazon-nova-lite',
  'Nova Mirco': 'amazon-nova-micro',
  // newer boards use API ids with the family and version swapped
  'claude-4-opus': 'claude-opus-4',
  'claude-4-sonnet': 'claude-sonnet-4',
  'claude-4-5-sonnet': 'claude-sonnet-4-5',
  'claude-4-5-haiku': 'claude-haiku-4-5',
  // the July 2025 Kimi K2 Instruct (the September one is "-0905")
  'kimi-k2-instruct': 'kimi-k2-jul-2025',
  'Muse Wonder 1.0': 'muse-wonder',
};

/** The feed line for a board: the page, and which tab's entries the importer reads. */
export const scaleFeed = (url: string, tab?: string) =>
  `${url} (the ${tab ? `"${tab}" tab's ` : ''}"entries" JSON in the page's Next.js flight data)`;

export interface ScaleEntry {
  model: string;
  version?: string;
  rank?: number;
  score: number;
  createdAt?: string;
  deprecated?: boolean;
  contaminationMessage?: string;
  /** The half-width of the "±" interval the page prints after the score. */
  confidenceInterval_upper?: number;
}

interface ScaleTab {
  key: string;
  label: string;
  entries: ScaleEntry[];
}

/** The page's flight text: the self.__next_f.push([1,"..."]) chunks joined in order. */
export async function scaleFlight(url: string): Promise<string> {
  return nextFlight(await fetchText(url));
}

/**
 * The entries of one tab. With no tab named, the tab the page opens on, or the page's only entries array.
 * A tab that is missing throws, so a renamed tab keeps the last rows instead of importing the wrong split.
 */
export function scaleEntries(text: string, tab?: string): ScaleEntry[] {
  const at = text.indexOf('"variants":[');
  if (at >= 0) {
    const tabs = jsonAt<ScaleTab[]>(text, at + '"variants":'.length);
    const active = text.slice(at).match(/"activeTab":"([^"]*)"/)?.[1];
    const want = tab ?? active ?? tabs[0]?.key;
    const hit = tabs.find((t) => t.key === want);
    if (!hit) throw new Error(`no "${want}" tab (tabs: ${tabs.map((t) => t.key).join(', ')})`);
    return hit.entries;
  }
  if (tab) throw new Error(`no tabs on the page, wanted "${tab}"`);
  const i = text.indexOf('"entries":[');
  if (i < 0) throw new Error('no entries array on the page');
  return jsonAt<ScaleEntry[]>(text, i + '"entries":'.length);
}

/** Fetches a board page and returns the entries of one tab (see scaleEntries). */
export async function fetchScaleEntries(url: string, tab?: string): Promise<ScaleEntry[]> {
  return scaleEntries(await scaleFlight(url), tab);
}

/**
 * "o3 (high) (April 2025)" -> { model: "o3 (April 2025)", setting: "high" }: an effort in parentheses that sits
 * before a snapshot date. Other names pass through with spaces collapsed.
 */
export function effortBeforeDate(raw: string): { model: string; setting?: string } {
  let model = raw.replace(/\s+/g, ' ').trim();
  const eff = model.match(/\s*\((minimal|low|medium|high|xhigh)\)(?=\s*\()/i);
  if (eff) model = model.replace(eff[0], '');
  return { model, setting: eff?.[1].toLowerCase() };
}

const LEVEL = '(minimal|low|medium|high|xhigh|max|default)';
// harness names as Scale writes them in parentheses, mapped to the names other boards use
const HARNESSES: [RegExp, string][] = [
  [/^claude[\s-]?code$/i, 'Claude Code'],
  [/^codex(?:[\s-]?cli)?$/i, 'Codex'],
  [/^mini[\s-]?swe(?:[\s-]?agent)?$/i, 'mini-SWE-agent'],
  [/^swe[\s-]?agent$/i, 'SWE-agent'],
  [/^gemini[\s-]?cli$/i, 'Gemini CLI'],
  [/^co[\s-]?work$/i, 'Cowork'],
  [/^terminus[\s-]?2$/i, 'terminus-2'],
];

/** The harness for a name Scale writes ("Claude Code", "Mini-SWE", "codex"), or undefined. */
export function scaleHarness(name: string): string | undefined {
  const n = name.trim();
  return HARNESSES.find(([re]) => re.test(n))?.[1];
}

/** A reasoning effort written in parentheses ("xHigh", "thinking", "Non-Thinking", "xhigh thinking"), or undefined. */
function effortWord(inner: string): string | undefined {
  const s = inner.trim().toLowerCase().replace(/\s+/g, ' ');
  const lvl = s.match(new RegExp(`^(?:(?:thinking|reasoning) )?${LEVEL}(?: (?:thinking|reasoning|effort))?$`));
  if (lvl) return lvl[1];
  if (/^(thinking|reasoning)$/.test(s)) return 'thinking';
  if (/^non[\s-]?(thinking|reasoning)$/.test(s)) return 'non-thinking';
  return undefined;
}

export interface ScaleName {
  model: string;
  setting?: string;
  harness?: string;
  /** Footnote marks Scale put after the name ("*", "†"), which each board defines. */
  marks: string;
}

/**
 * Splits a Scale board name into model, reasoning effort, harness and footnote marks:
 * "Opus 5 (Claude Code) xHigh*" -> Opus 5 / xhigh / Claude Code / "*",
 * "gpt-5.4-2026-03-05 (xhigh thinking)" -> gpt-5.4-2026-03-05 / xhigh,
 * "claude-opus-4-6-thinking-max" -> claude-opus-4-6 / max, "o3-2025-04-16-high" -> o3-2025-04-16 / high,
 * "glm-5p2" -> glm-5.2.
 * A bare effort word at the end of an undated name ("kimi-k3 max", "gpt-5.6-sol-high") is left for the shared
 * resolver, which tries the full name first, since some model names end in such a word ("Qwen3.8-Max").
 */
export function scaleName(raw: string): ScaleName {
  let s = raw.replace(/\s+/g, ' ').trim();
  const marks = s.match(/[\s*†‡]+$/)?.[0].replace(/\s/g, '') ?? '';
  s = s.slice(0, s.length - (s.match(/[\s*†‡]+$/)?.[0].length ?? 0)).trim();
  let harness: string | undefined;
  let setting: string | undefined;
  // a bare effort word next to a harness is the setting: "Opus 5 (Claude Code) xHigh", "Gpt 5.4 xHigh (Mini-SWE)".
  // Before the harness "max" stays in the name, since "Qwen 3.7 Max (mini-SWE-agent)" is a model.
  s = s
    .replace(new RegExp(`(\\(([^()]+)\\))\\s+${LEVEL}$`, 'i'), (m, paren: string, inner: string, lvl: string) => {
      if (!scaleHarness(inner)) return m;
      setting = lvl.toLowerCase();
      return paren;
    })
    .replace(/\s(minimal|low|medium|high|xhigh)\s*(\(([^()]+)\))/i, (m, lvl: string, paren: string, inner: string) => {
      if (setting || !scaleHarness(inner)) return m;
      setting = lvl.toLowerCase();
      return ` ${paren}`;
    });
  s = s
    .replace(/\s*\(([^()]+)\)/g, (m, inner: string) => {
      const h = scaleHarness(inner);
      if (h && !harness) {
        harness = h;
        return '';
      }
      const e = effortWord(inner);
      if (e && !setting) {
        setting = e;
        return '';
      }
      return m;
    })
    .replace(/\s+/g, ' ')
    .trim();
  // a harness written first: "Codex GPT 5.5"
  const lead = s.match(/^(codex|claude code)\s+(?=\S)/i);
  if (lead && !harness) {
    harness = scaleHarness(lead[1]);
    s = s.slice(lead[0].length);
  }
  // "-thinking-max", "-reasoning-high": the level is the setting
  const think = !setting ? s.match(new RegExp(`[-_ ](?:thinking|reasoning)[-_ ]${LEVEL}$`, 'i')) : null;
  if (think) {
    setting = think[1].toLowerCase();
    s = s.slice(0, think.index);
  }
  // a dated API id with an effort after the date: "o3-2025-04-16-high", "claude-opus-4-5-20251101-thinking"
  const dated = !setting ? s.match(new RegExp(`([-_ ]20\\d\\d-?\\d\\d-?\\d\\d)[-_ ](?:${LEVEL}|(thinking|reasoning))$`, 'i')) : null;
  if (dated) {
    setting = (dated[2] ?? 'thinking').toLowerCase();
    s = s.slice(0, dated.index! + dated[1].length);
  }
  // "Claude 3.7 Sonnet Thinking (February 2025)": Claude has no separate thinking model, so the word is the setting
  // (Gemini's is a model: "Gemini 2.0 Flash Thinking")
  const claude = !setting && /^claude\b/i.test(s) ? s.match(/\s+thinking(?=\s*(?:\(|$))/i) : null;
  if (claude) {
    setting = 'thinking';
    s = (s.slice(0, claude.index) + s.slice(claude.index! + claude[0].length)).replace(/\s*\(/, ' (').trim();
  }
  // Fireworks ids write a version point as "p": "glm-5p2", "kimi-k2p5", "qwen3p8-2p4t-a95b"
  s = s.replace(/(\d)p(\d)/g, '$1.$2');
  return { model: s, setting, harness, marks };
}

/** The effort Scale wrote in the version field only: "o3-mini" with version "o3-mini-2025-01-31 (high)". */
export function versionEffort(version?: string): string | undefined {
  const p = version?.match(/\(([^()]+)\)\s*$/);
  return p ? effortWord(p[1]) : undefined;
}

/**
 * Rows for a board: deprecated entries (drawn grayed out) and "Unknown model" are skipped, names split by
 * scaleName, no date (createdAt is not a run date). `extra` adds or overrides fields per entry, for example a
 * harness that a footnote mark names.
 */
export function scaleRows(
  entries: ScaleEntry[],
  extra?: (name: ScaleName, entry: ScaleEntry) => Partial<LeaderboardRow> | undefined,
): LeaderboardRow[] {
  return entries
    .filter((e) => !e.deprecated && e.model.trim() !== 'Unknown model' && Number.isFinite(Number(e.score)))
    .map((e) => {
      const n = scaleName(e.model);
      const row: LeaderboardRow = { model: n.model, score: Number(e.score) };
      const setting = n.setting ?? versionEffort(e.version);
      if (setting) row.setting = setting;
      if (n.harness) row.harness = n.harness;
      const half = Number(e.confidenceInterval_upper);
      if (half > 0) row.metrics = { ciLow: row.score - half, ciHigh: row.score + half };
      const more = extra?.(n, e);
      // an importer's own metrics add to the interval rather than replace it
      return { ...row, ...more, ...(row.metrics || more?.metrics ? { metrics: { ...row.metrics, ...more?.metrics } } : {}) };
    });
}
