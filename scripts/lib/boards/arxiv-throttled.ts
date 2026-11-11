// Readers for arXiv paper tables. Serialize these arXiv requests and honor its 15-second crawl delay.
import { fetchText } from '../util.ts';
import { tables } from '../html.ts';

let pending: Promise<unknown> = Promise.resolve();
let last = 0;
export function paperHtml(url: string) {
  const request = pending.catch(() => {}).then(async () => {
    await new Promise(resolve => setTimeout(resolve, Math.max(0, 15_100 - (Date.now() - last))));
    last = Date.now();
    return fetchText(url, {}, 1);
  });
  pending = request;
  return request;
}

export async function paperTables(url: string) {
  return tables(await paperHtml(url));
}

export function numberCell(value: string): number {
  if (!/^-?\d+(?:\.\d+)?$/.test(value.trim())) throw new Error(`Unexpected paper number: ${value}`);
  return Number(value);
}

export const PAPER_TERMS = 'arXiv permits these HTML paths under robots.txt; the paper tables are attributed to their authors.';
