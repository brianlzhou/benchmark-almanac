// Humanity's Last Exam: lastexam.ai points to Scale's leaderboard (made with CAIS) for current results.
// The page ships its rows as a JSON "entries" array inside the Next.js flight data in its script tags.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://labs.scale.com/leaderboard/humanitys_last_exam';

interface Entry {
  model: string;
  version?: string;
  rank: number;
  score: number;
  createdAt?: string;
  deprecated?: boolean;
}

/** Joins the self.__next_f.push([1,"..."]) string chunks back into the flight text. */
function flight(html: string): string {
  let out = '';
  for (const m of html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)) out += JSON.parse(m[1]) as string;
  return out;
}

/** Reads the JSON array that starts at text[i] by bracket matching (strings respected). */
function arrayAt(text: string, i: number): unknown[] {
  let depth = 0;
  let str = false;
  for (let j = i; j < text.length; j++) {
    const c = text[j];
    if (str) {
      if (c === '\\') j++;
      else if (c === '"') str = false;
    } else if (c === '"') str = true;
    else if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') {
      if (--depth === 0) return JSON.parse(text.slice(i, j + 1)) as unknown[];
    }
  }
  throw new Error('unterminated array');
}

const board: Leaderboard = {
  benchmark: 'humanitys-last-exam',
  url: PAGE,
  feed: `${PAGE} (the "entries" JSON in the page's Next.js flight data)`,
  terms: "Scale's website terms (2021) license site use for your own purposes and do not mention automated access; robots.txt allows /leaderboard/.",
  aliases: {
    'GPT 6 Astra': 'gpt-6-astra',
  },
  async fetch() {
    const text = flight(await fetchText(PAGE));
    const at = text.indexOf('"entries":[');
    if (at < 0) throw new Error('no entries array on the page');
    const entries = arrayAt(text, at + '"entries":'.length) as Entry[];
    return entries
      .filter((e) => !e.deprecated)
      .map((e) => ({
        model: e.model.replace(/\s+/g, ' ').trim(),
        score: Number(e.score),
        date: e.createdAt?.slice(0, 10),
      }));
  },
};
export default board;
