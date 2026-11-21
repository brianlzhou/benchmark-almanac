// fev-bench ranks forecasters by win rate across 100 tasks with scaled quantile loss.
// Download the default Streamlit table as CSV so its model filters and imputation match the live board.
import type { Leaderboard } from './types.ts';
import { chromium } from 'playwright-core';
import { parseCsv } from '../lib/util.ts';

const url = "https://huggingface.co/spaces/autogluon/fev-bench";
const feed = "https://autogluon-fev-bench.hf.space/";

const board: Leaderboard = {
  benchmark: 'fev-bench', url, feed,
  terms: "The Space lists apache-2.0 for its repository. https://huggingface.co/spaces/autogluon/fev-bench/blob/main/README.md" ,
  stats: { skillScore: { name: 'Skill score', unit: 'score', better: 'higher' }, runtimePer100: { name: 'Inference time per 100 forecasts', unit: 'seconds', better: 'lower' } },
  async fetch() {
    const browser = await chromium.launch({channel:'chrome'});
    try {
      const page = await browser.newPage();
      // Streamlit uses a normal CSV download when the browser has no native file picker.
      await page.addInitScript(() => { Reflect.deleteProperty(window, 'showSaveFilePicker'); });
      await page.goto(feed);
      const frame = page.locator('[data-testid="stDataFrame"]').first();
      const button = frame.locator('button[aria-label="Download as CSV"]');
      await button.waitFor({state:'attached'});
      const count = await page.getByText(/^\d+ models$/).first().innerText();
      const [download] = await Promise.all([page.waitForEvent('download'), button.evaluate(el => (el as HTMLButtonElement).click())]);
      const stream = await download.createReadStream();
      if (!stream) throw new Error('Missing Streamlit CSV');
      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(Buffer.from(chunk));
      const data = parseCsv(Buffer.concat(chunks).toString('utf8').replace(/^\uFEFF/,''));
      if (data.length < 35 || data.length !== Number.parseInt(count)) throw new Error('Incomplete fev-bench export');
      return data.map(r => {
        if (!r.model_name || !r.win_rate || !r.skill_score || !r.median_inference_time_s_per100) throw new Error('Missing fev-bench columns');
        const [link,name] = r.model_name.split('#');
        const score = Number(r.win_rate), skill = Number(r.skill_score), runtime = Number(r.median_inference_time_s_per100);
        if (![score,skill,runtime].every(Number.isFinite)) throw new Error('Invalid forecast score');
        return {model: name ? decodeURIComponent(name) : r.model_name, link: name ? link : undefined, score,
          metrics:{skillScore:skill, runtimePer100:runtime}, setting:'SQL'};
      });
    } finally {
      await browser.close();
    }
  },
};
export default board;
