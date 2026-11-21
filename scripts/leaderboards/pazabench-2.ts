// PazaBench ranks speech recognition models by mean character error rate across languages. Its Gradio callback returns the displayed individual-model tables.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = "https://microsoft-paza-bench.hf.space/gradio_api/call/update_metric_dataframes_with_telemetry";
const board: Leaderboard = {
  benchmark: "pazabench-2",
  url: "https://huggingface.co/spaces/microsoft/paza-bench",
  feed,
  terms: "The Space uses MIT. Its default score tables aggregate model families. Source recordings have separate licenses. Both hosts permit crawling.",
  parts: {
    wer: 'Word error rate', rtfx: { name: 'Inverse real-time factor', unit: 'speedup', better: 'higher' },
    Acholi: 'Acholi', 'Adamawa Fulfulde': 'Adamawa Fulfulde', Afrikaans: 'Afrikaans', Akan: 'Akan', Amharic: 'Amharic', Arabic: 'Arabic', Baatonum: 'Baatonum', Bafut: 'Bafut', Bankon: 'Bankon', Basaa: 'Basaa', 'Borgu Fulfulde': 'Borgu Fulfulde', 'Chadian Arabic': 'Chadian Arabic', Dagaare: 'Dagaare', Dagbani: 'Dagbani', Dholuo: 'Dholuo', Dioula: 'Dioula', Ekoti: 'Ekoti', Ewe: 'Ewe', Fongbe: 'Fongbe', Fula: 'Fula', Hausa: 'Hausa', Igbo: 'Igbo', Ikposo: 'Ikposo', Kabyle: 'Kabyle', Kalenjin: 'Kalenjin', Kamba: 'Kamba', Kanuri: 'Kanuri', "Kidaw'ida": "Kidaw'ida", Kikuyu: 'Kikuyu', Kinyarwanda: 'Kinyarwanda', Lingala: 'Lingala', Luganda: 'Luganda', Maasai: 'Maasai', Malagasy: 'Malagasy', Mbo: 'Mbo', 'Northern Sotho': 'Northern Sotho', Nyanja: 'Nyanja', Nyankole: 'Nyankole', Nyungwe: 'Nyungwe', Oromo: 'Oromo', Sesotho: 'Sesotho', Setswana: 'Setswana', Shona: 'Shona', Sidamo: 'Sidamo', Soga: 'Soga', Somali: 'Somali', Sukuma: 'Sukuma', Swahili: 'Swahili', Swati: 'Swati', Tamazight: 'Tamazight', Tigre: 'Tigre', Tigrinya: 'Tigrinya', Tshivenda: 'Tshivenda', Twi: 'Twi', Umbundu: 'Umbundu', Wolaytta: 'Wolaytta', Wolof: 'Wolof', Xhosa: 'Xhosa', Xitsonga: 'Xitsonga', Yoruba: 'Yoruba', Zulu: 'Zulu',
  },
  async fetch() {
    const event = JSON.parse(await fetchText(feed, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ data: [[], [], [], 'Individual models', [], 'All'] }) }));
    if (!event.event_id) throw new Error('Missing PazaBench event');
    await new Promise(r => setTimeout(r, 1000));
    const stream = await fetchText(feed + '/' + encodeURIComponent(event.event_id));
    const result = stream.match(/event: complete\r?\ndata: ([^\r\n]+)/);
    if (!result) throw new Error('PazaBench table request failed');
    type Frame = {headers:string[]; data:(number|string|null)[][]};
    const frames: Frame[] = JSON.parse(result[1]);
    if (frames.length !== 3 || frames.some(t => t.headers[1] !== 'Language' || t.headers.length < 55 || t.data.length < 61)) throw new Error('Incomplete PazaBench tables');
    return frames[0].headers.slice(2).map(model => {
      const metrics: Record<string,number> = {};
      const means = frames.map((table,i) => {
        const col = table.headers.indexOf(model);
        if (col < 2) throw new Error('Missing metric for ' + model);
        const values: number[] = [];
        for (const row of table.data) {
          const value = row[col];
          if (value == null) continue;
          if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Invalid PazaBench cell');
          const scaled = value * (i === 2 ? 1 : 100);
          values.push(scaled);
          if (i === 0) { const lang = String(row[1]); board.parts![lang] = lang; metrics[lang] = scaled; }
        }
        if (!values.length) throw new Error('Empty PazaBench column');
        return values.reduce((a,b) => a+b,0) / values.length;
      });
      return { model, score: means[0], metrics: { ...metrics, wer: means[1], rtfx: means[2] } };
    });
  },
};
export default board;
