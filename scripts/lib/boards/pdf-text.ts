// Extract the text layer from a maker's PDF. Requires Poppler's pdftotext on PATH.
// PDF bytes stay in memory. This does not run document scripts or use OCR.
import { execFileSync } from 'node:child_process';
import { fetchBytes } from '../util.ts';
export async function pdfText(url: string): Promise<string> {
  return execFileSync('pdftotext', ['-layout', '-', '-'], {
    input: Buffer.from(await fetchBytes(url)), encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
  });
}
