// GeoFlip tests whether video generators respond to geometric changes with the correct physical outcome.
// Table 2 ranks models by their mean rank across event correctness, structure and reference similarity.
// We transcribed Table 2 twice and compared the transcriptions. The image hash guards all 16 rows.
import type { Leaderboard } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2610.42002';
const asset = '2610.42002v2/asset05_rq1_table.png';
const feed = new URL(asset, url).href;
const board: Leaderboard = {
  benchmark: 'geoflip', static: 'paper', url, feed, terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  headline: 'Table 2 ranks models by the mean of their ranks across three dimensions. A lower mean rank is better.',
  parts: { event: {name:'Event',unit:'%'}, structure: {name:'Structure',unit:'%'},
    psnr: {name:'PSNR',unit:'score',note:'Peak signal-to-noise ratio in decibels.'},
    ssim: {name:'SSIM',unit:'score',note:'Structural similarity index.'} },
  async fetch() {
    const html = await paperHtml(url);
    if (!html.includes('src="' + asset + '"')) throw Error('Reviewed ranking image is missing');
    await new Promise(resolve => setTimeout(resolve,15100));
    return checked(await chartRows(feed,'f108fdbb3a92e2a5aecb4d15dc4a3e56e1dd1fdf4d6cc62a2c390b65eaac811c',[
      { model: 'Wan2.2-I2V-A14B', score: 3.17, metrics: { event: 27.98, structure: 34.38, psnr: 28.68, ssim: 0.9659 } },
      { model: 'MiniMax-H3', score: 3.67, metrics: { event: 23.06, structure: 48.31, psnr: 28.38, ssim: 0.9600 } },
      { model: 'LingBot-World-Fast', score: 4.33, metrics: { event: 26.69, structure: 60.81, psnr: 21.88, ssim: 0.9060 } },
      { model: 'LTX-Video-2B', score: 5.83, metrics: { event: 18.41, structure: 38.13, psnr: 29.87, ssim: 0.9494 } },
      { model: 'HunyuanVideo-1.5-I2V', score: 6.00, metrics: { event: 24.38, structure: 29.12, psnr: 26.37, ssim: 0.9301 } },
      { model: 'Wan2.1-I2V-14B-480P', score: 6.00, metrics: { event: 22.53, structure: 41.84, psnr: 23.78, ssim: 0.9157 } },
      { model: 'Cosmos3-Super', score: 6.17, metrics: { event: 21.10, structure: 51.55, psnr: 25.99, ssim: 0.9008 } },
      { model: 'VBVR-Wan2.2', score: 7.00, metrics: { event: 17.66, structure: 32.66, psnr: 28.05, ssim: 0.9627 } },
      { model: 'DynamiCrafter-1024', score: 7.67, metrics: { event: 16.87, structure: 59.01, psnr: 23.24, ssim: 0.9024 } },
      { model: 'SVD-XT', score: 9.67, metrics: { event: 13.00, structure: 27.08, psnr: 27.30, ssim: 0.9446 } },
      { model: 'CogVideoX-5B-I2V', score: 10.17, metrics: { event: 19.91, structure: 14.79, psnr: 18.64, ssim: 0.8716 } },
      { model: 'SkyReels-V2-I2V-14B', score: 10.17, metrics: { event: 19.22, structure: 13.84, psnr: 18.14, ssim: 0.9214 } },
      { model: 'I2VGen-XL', score: 12.83, metrics: { event: 15.56, structure: 7.65, psnr: 19.46, ssim: 0.8629 } },
      { model: 'CogVideoX1.5-5B-I2V', score: 13.33, metrics: { event: 15.22, structure: 0.00, psnr: 18.54, ssim: 0.9086 } },
      { model: 'HunyuanVideo-I2V-720P', score: 14.33, metrics: { event: 10.28, structure: 10.93, psnr: 16.95, ssim: 0.8566 } },
      { model: 'SkyReels-V1-I2V', score: 15.67, metrics: { event: 4.21, structure: 5.27, psnr: 11.69, ssim: 0.6251 } },
    ]),16);
  },
};
export default board;
