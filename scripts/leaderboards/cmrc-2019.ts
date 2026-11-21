// CMRC 2019 ranks systems by passage accuracy and reports question accuracy alongside it.
// The official HTML table identifies the submission, institution and date.
import type { Leaderboard } from './types.ts';
import { tables, text } from '../lib/html.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://ymcui.com/cmrc2019/";
const board: Leaderboard = {
  benchmark: "cmrc-2019",
  url: "https://ymcui.com/cmrc2019/",
  feed,
  terms: "The organizers license the dataset under CC BY-SA 4.0. The ranking page gives no separate score reuse terms. The site's robots.txt lists a sitemap and no disallow rules.",
  stats: { qac: { name: 'Question-level accuracy', unit: '%', better: 'higher' } },
  async fetch() {
    const html = await fetchText(feed);
    // The page omits closing row tags on the ranked entries.
    const table = tables(html.replace(/(<\/td>)\s*(?=<tr|<\/tbody|<\/table)/gi, '$1</tr>')).find(t => t[1]?.map(c => c.text).join('|') === 'QAC|PAC');
    if (!table) throw new Error('Missing QAC and PAC columns');
    const rows = table.slice(2).filter(r => !r[1]?.text.includes('Human Performance')).map(r => {
      const [modelHtml, institution] = r[1].html.split(/<p class="institution">/);
      const model = text(modelHtml);
      const date = r[0].text.match(/\d{4}\/\d{2}\/\d{2}/)?.[0].replaceAll('/', '-');
      if (!model || !date || !institution || [r[2], r[3]].some(c => !c?.text || !Number.isFinite(Number(c.text)))) throw new Error('Invalid CMRC result');
      return { model, date, submitter: text(institution.split('</p>')[0]), score: Number(r[3].text), metrics: { qac: Number(r[2].text) } };
    });
    if (rows.length < 7) throw new Error('Missing CMRC entries');
    return rows;
  },
};
export default board;
