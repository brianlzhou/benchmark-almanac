// EmbodiedCLUE-VLA RoboTwin evaluates vision-language-action models on RoboTwin tasks.
// The headline is the overall score, with the published 95% interval and training-data setting preserved.
// This importer reads the November XLSX workbook linked by the publisher and its overall sheet.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchBytes } from '../lib/util.ts';
const PAGE = 'https://www.superclueai.com/embodied/VLA_desk2';
const FEED = 'https://www.superclueai.com/data/embodied_list/VLA_desk2/2026%E5%B9%B411%E6%9C%88.xlsx';
const text = (bytes: Uint8Array) => new TextDecoder().decode(bytes);
async function unzip(bytes: Uint8Array, wanted: string): Promise<string> {
  for (let p = 0; p + 46 < bytes.length; p++) {
    if (bytes[p] !== 0x50 || bytes[p + 1] !== 0x4b || bytes[p + 2] !== 1 || bytes[p + 3] !== 2) continue;
    const method = bytes[p + 10] | bytes[p + 11] << 8;
    const size = bytes[p + 20] | bytes[p + 21] << 8 | bytes[p + 22] << 16 | bytes[p + 23] << 24;
    const nameLen = bytes[p + 28] | bytes[p + 29] << 8; const extraLen = bytes[p + 30] | bytes[p + 31] << 8; const commentLen = bytes[p + 32] | bytes[p + 33] << 8;
    const local = bytes[p + 42] | bytes[p + 43] << 8 | bytes[p + 44] << 16 | bytes[p + 45] << 24;
    const name = text(bytes.slice(p + 46, p + 46 + nameLen));
    if (name === wanted) {
      const localNameLen = bytes[local + 26] | bytes[local + 27] << 8; const localExtraLen = bytes[local + 28] | bytes[local + 29] << 8; const start = local + 30 + localNameLen + localExtraLen; const data = bytes.slice(start, start + size);
      if (method === 0) return text(data);
      if (method === 8) return text(new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()));
      throw new Error(`XLSX: unsupported compression for ${wanted}`);
    }
    p += 45 + nameLen + extraLen + commentLen;
  }
  throw new Error(`XLSX: missing ${wanted}`);
}
const cells = (xml: string) => [...xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map((row) => [...row[1].matchAll(/<c\b([^>]*)>(?:<v>([\s\S]*?)<\/v>)?[\s\S]*?<\/c>/g)].map((m) => ({ ref: m[1].match(/\br="([^"]+)/)?.[1] ?? '', type: m[1].match(/\bt="([^"]+)/)?.[1], value: m[2] ?? '' })));
const col = (ref: string) => ref.match(/[A-Z]+/)![0];
const board: Leaderboard = {
  benchmark: 'embodiedclue-vla-robotwin', url: PAGE, feed: FEED,
  terms: 'SuperCLUE publishes the XLSX score table on its public page. The site gives no separate score reuse license. Results are credited to SuperCLUE.',
  async fetch(): Promise<LeaderboardRow[]> {
    const bytes = new Uint8Array(await fetchBytes(FEED)); const sharedXml = await unzip(bytes, 'xl/sharedStrings.xml'); const strings = [...sharedXml.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => m[1]); const sheet = cells(await unzip(bytes, 'xl/worksheets/sheet2.xml'));
    const rows = sheet.slice(1).map((row) => Object.fromEntries(row.map((c) => [col(c.ref), c.type === 's' ? strings[Number(c.value)] : c.value])));
    if (rows.length < 10) throw new Error(`EmbodiedCLUE-VLA: ${rows.length} rows, expected at least 10`);
    return rows.map((r) => { const score = Number(r.D); if (!r.B || !Number.isFinite(score)) throw new Error('EmbodiedCLUE-VLA: invalid row'); const ci = String(r.E ?? '').match(/-([\d.]+)\/\+([\d.]+)/); return { model: String(r.B), score, submitter: String(r.C ?? ''), low: ci ? score - Number(ci[1]) : undefined, high: ci ? score + Number(ci[2]) : undefined, setting: String(r.H ?? '') }; });
  },
};
export default board;
