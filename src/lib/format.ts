import type { Model } from './types.ts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-09-22" -> "Sep 2026" */
export function monthYear(d: string | null | undefined): string {
  if (!d) return '';
  const [y, m] = d.split('-');
  return m ? `${MONTHS[Number(m) - 1]} ${y}` : y;
}

/** "2026-09-22" -> "22 Sep 2026" */
export function fullDate(d: string | null | undefined): string {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return day ? `${Number(day)} ${MONTHS[Number(m) - 1]} ${y}` : monthYear(d);
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

export function score(value: number, unit = '%'): string {
  if (unit === '%') return `${value >= 10 || value === 0 ? value.toFixed(1) : value.toFixed(2)}%`.replace('.0%', '%');
  if (unit === 'usd') return `$${Math.round(value).toLocaleString('en-US')}`;
  if (unit === 'minutes') return value >= 120 ? `${(value / 60).toFixed(1)} h` : `${value < 10 ? value.toFixed(1) : Math.round(value)} min`;
  if (unit === 'elo' || unit === 'rating') return Math.round(value).toLocaleString('en-US');
  return `${value < 10 ? value.toFixed(2) : value.toFixed(1)}${UNIT_SUFFIX[unit] ?? ''}`;
}

/** Score without its unit sign, for dense columns. */
export function scoreBare(value: number, unit = '%'): string {
  return unit === '%' ? (value >= 10 || value === 0 ? value.toFixed(1) : value.toFixed(2)) : score(value, unit);
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
