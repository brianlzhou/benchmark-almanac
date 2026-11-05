import type { Model } from './types.ts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-09-22" -> "Sep 2026" */
export function monthYear(d: string | null | undefined): string {
  if (!d) return '';
  const [y, m] = d.split('-');
  return m ? `${MONTHS[Number(m) - 1]} ${y}` : y;
}

/** "2026-09-22" -> "Sep 22, 2026", for table cells and other tight spots */
export function fullDate(d: string | null | undefined): string {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return day ? `${MONTHS[Number(m) - 1]} ${Number(day)}, ${y}` : monthYear(d);
}

const LONG_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;

/** "2026-11-02" -> "November 2nd, 2026", and "2026-11" -> "November 2026", for dates in sentences */
export function humanDate(d: string | null | undefined): string {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  if (!m) return y;
  const month = LONG_MONTHS[Number(m) - 1];
  return day ? `${month} ${ordinal(Number(day))}, ${y}` : `${month} ${y}`;
}

/** "2026-09-22" -> "September 2026" */
export function longMonthYear(d: string | null | undefined): string {
  return d ? humanDate(d.slice(0, 7)) : '';
}

/** Full dates written as 2026-02-12 inside a sentence (the data's notes), as "February 12th, 2026" */
export function proseDates(text: string): string {
  return text.replace(/\b(20\d\d)-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/g, (d) => humanDate(d));
}

/** Decimal year, for time axes. */
export function yearFrac(d: string): number {
  const [y, m = '1', day = '15'] = d.split('-');
  return Number(y) + (Number(m) - 1) / 12 + (Number(day) - 1) / 365;
}

export function modelName(m: Model | undefined): string {
  return m ? m.name : 'Unknown model';
}

const UNIT_SUFFIX: Record<string, string> = { elo: '', rating: '', usd: '', minutes: ' min', speedup: '×', score: '', brier: '' };

/** One decimal place, or two just under 100, so 99.95 never reads as a perfect 100. */
const pct = (v: number) => (v >= 99.95 && v < 100 ? v.toFixed(2) : v >= 10 || v === 0 ? v.toFixed(1) : v.toFixed(2));

export function score(value: number, unit = '%'): string {
  if (unit === '%') return `${pct(value)}%`.replace('.0%', '%');
  if (unit === 'usd') return `$${Math.round(value).toLocaleString('en-US')}`;
  if (unit === 'minutes') return value >= 120 ? `${(value / 60).toFixed(1)} h` : `${value < 10 ? value.toFixed(1) : Math.round(value)} min`;
  if (unit === 'elo' || unit === 'rating') return Math.round(value).toLocaleString('en-US');
  if (unit === 'index') return value.toFixed(1);
  return `${value < 10 ? value.toFixed(2) : value.toFixed(1)}${UNIT_SUFFIX[unit] ?? ''}`;
}

/** Score without its unit sign, for dense columns. */
export function scoreBare(value: number, unit = '%'): string {
  return unit === '%' ? pct(value) : score(value, unit);
}

export function count(n: number, one: string, many = `${one}s`): string {
  return `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;
}

export function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function repoName(url: string): string {
  const m = url.match(/github\.com\/([^/]+\/[^/#?]+)/);
  return m ? m[1] : hostname(url);
}

/** A reported number at reading precision: 42.0389 -> "42", 98.983 -> "99", 0.5282 -> "0.528". The data keeps the full value. */
export function shortNum(v: number): string {
  const a = Math.abs(v);
  return String(Number(v.toFixed(a >= 10 ? 1 : a >= 1 ? 2 : 3)));
}

/** Lowercase a label for use mid-sentence, but keep acronyms and names ("AI research tasks", "SQL"). */
export function lowerLabel(s: string): string {
  return s.replace(/\b([A-Z])([a-z]+)\b/g, (_, a: string, b: string) => a.toLowerCase() + b);
}
