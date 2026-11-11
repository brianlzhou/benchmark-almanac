// RRC's certificate chain is rejected by Node's bundled trust store on some hosts.
// curl uses the system trust store and verifies TLS normally. Never disable certificate verification.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fetchText } from '../util.ts';
const exec = promisify(execFile);
export async function rrcPage(url: string): Promise<string> {
  if (new URL(url).hostname !== 'rrc.cvc.uab.es') throw new Error('Unexpected RRC host');
  try { return await fetchText(url, {}, 1, 40_000); }
  catch (error) {
    const { stdout } = await exec('curl', ['--fail', '--silent', '--show-error', '--max-time', '40',
      '--user-agent', 'benchmark-almanac (+https://github.com/brianlzhou/benchmark-almanac)', url],
      {maxBuffer: 8 * 1024 * 1024});
    if (!stdout.includes('<table')) throw error;
    return stdout;
  }
}
