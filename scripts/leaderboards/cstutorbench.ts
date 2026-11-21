// CSTutorBench grades tutoring on 17 block-programming scenarios. The makers' Results sheet
// gives the fraction of available rubric points for each model under two different system prompts.
import { execFileSync } from 'node:child_process';
import type { Leaderboard } from './types.ts';
import { fetchBytes } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://github.com/InviteInstitute/CSTutorBench';
const feed = 'https://raw.githubusercontent.com/InviteInstitute/CSTutorBench/HEAD/results_script-check-hybrid-claude-sonnet-4-6-v4.xlsx';
const reader = `
import io, json, sys, zipfile, xml.etree.ElementTree as ET
with zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())) as book:
    sheet = ET.fromstring(book.read('xl/worksheets/sheet1.xml'))
print(json.dumps([[''.join(cell.itertext()) for cell in row] for row in sheet.findall('.//{*}row')]))
`;
const board: Leaderboard = {
  benchmark: 'cstutorbench', url, feed,
  terms: 'The makers release the repository under the MIT license. ' + url + '/blob/HEAD/LICENSE',
  aliases: { gemma3_27b: 'gemma-3-27b', gemma3_4b: 'gemma-3-4b', gemma4_e4b: 'gemma-4-e4b-it',
    'gpt-oss_20b': 'gpt-oss-20b', 'nemotron-3-super_120b': 'nemotron-3-super',
    'qwen3-coder_30b': 'qwen3-coder-30b-a3b-instruct', 'qwen3.5_9b': 'qwen3-5-9b' },
  async fetch() {
    const sheet: string[][] = JSON.parse(execFileSync('python3', ['-c', reader], {
      input: Buffer.from(await fetchBytes(feed)), encoding: 'utf8',
    }));
    const [header] = sheet;
    if (header.slice(0, 3).join('|') !== 'Model|Trial|Overall' || header.length !== 14) throw Error('Missing rubric columns');
    const end = sheet.findIndex(row => row[0] === 'LEADERBOARD');
    if (end < 1) throw Error('Missing end of results');
    const criteria = header.slice(3);
    board.parts = Object.fromEntries(criteria.map(name => [name.replaceAll(' ', ''), name]));
    const rows = sheet.slice(1, end).filter(row => row[0]).map(([model, trial, overall, ...cells]) => {
      const values = [overall, ...cells];
      if (!['1','2'].includes(trial) || cells.length !== criteria.length || values.some(value => !value || !Number.isFinite(Number(value)))) throw Error('Invalid tutor row');
      const metrics = Object.fromEntries(criteria.map((name, index) => [name.replaceAll(' ', ''), Number(cells[index])]));
      return { model, setting: 'Trial ' + trial + ' system prompt', score: Number(overall), metrics };
    });
    return checked(rows, 22);
  },
};
export default board;
