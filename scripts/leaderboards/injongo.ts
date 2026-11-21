// INJONGO tests intent detection and slot filling in 16 African languages.
// Tables 5 and 6 report mean intent accuracy and slot F1. The English reference is outside both averages.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { pdfText } from '../lib/boards/pdf-text.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://aclanthology.org/2025.acl-long.464.pdf';
const languages = 'eng amh ewe hau ibo kin lin lug orm sna sot swa twi wol xho yor zul'.split(' ');
const board: Leaderboard = {
  benchmark: 'injongo', url: 'https://aclanthology.org/2025.acl-long.464/', feed, static: 'paper',
  terms: 'The ACL Anthology publishes this paper under the terms at https://aclanthology.org/faq/copyright/.',
  headline: 'The headline is mean intent detection accuracy across the 16 African languages.',
  aliases: { 'GPT-4o (Aug)': 'gpt-4o-aug-2024', 'Llama 3.3 70B': 'llama-3-3-70b-instruct' },
  async fetch() {
    const paper = await pdfText(feed);
    const result: LeaderboardRow[] = [];
    const parts: NonNullable<Leaderboard['parts']> = {};
    for (const [caption, count] of [['Table 5: Intent detection', 8], ['Table 6: Zero-Shot performance', 7]] as const) {
      const body = paper.split(caption)[0].split('\f').at(-1)!;
      if (!body.split('\n')[0].trim().replace(/\s+/g, ' ').endsWith(languages.join(' ') + ' AVG')) throw new Error('Missing INJONGO language columns');
      const data = body.split('\n').map(line => line.replace(/^\s*(?:I NTENT|D ETECTION|S LOT|F ILLING)\s+/, '').trim())
        .map(line => line.match(/^(.+?)\s+((?:\d+\.\d+\s+){17})(\d+\.\d+)±(\d+\.\d+)$/)).filter(m => m !== null);
      if (data.length !== count * 2) throw new Error('INJONGO task row count changed');
      for (let i = 0; i < count; i++) {
        const intent = data[i], slot = data[i + count];
        const normalize = (s: string) => s.replace(' IT ', ' ').replace(' Instruct', '').replace('AfroXLMR-76L', 'AfroXLMR 76L');
        if (normalize(intent[1]) !== normalize(slot[1])) throw new Error('Intent and slot model identities differ');
        const metrics: Record<string, number> = { std: Number(intent[4]), slotF1: Number(slot[3]), slotStd: Number(slot[4]) };
        for (const [task, row] of [['Intent detection', intent], ['Slot filling', slot]] as const) {
          const scores = row[2].trim().split(/\s+/).map(Number);
          languages.forEach((name, j) => { const key = task + ' ' + name; parts[key] = { name, group: task }; metrics[key] = scores[j]; });
        }
        const setting = count === 7 ? 'Zero-shot' : i === count - 1 ? 'Multilingual training' : 'In-language training';
        result.push({ model: intent[1], score: Number(intent[3]), setting, metrics });
      }
    }
    parts.slotF1 = 'Slot filling F1';
    board.parts = parts;
    return checked(result, 15);
  },
};
export default board;
