// EchoChain compares voice agents on interrupted spoken instructions. The Labelbox page embeds the scored leaderboard in its Next.js data.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = "https://labelbox.com/leaderboards/echochain/";

interface LabelboxRow { label: string; model: string; elo: number }
export async function labelboxData(url: string, slug: string) {
  const page = await fetchText(url);
  const script = page.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!script) throw new Error('Missing Labelbox page payload');
  const props = JSON.parse(script[1]).props.pageProps;
  if (props.id !== slug) throw new Error(`Expected Labelbox board ${slug}`);
  return props.page.customData;
}

const board: Leaderboard = {
  benchmark: "echochain-labelbox",
  url: "https://labelbox.com/leaderboards/echochain/",
  feed: FEED,
  terms: "Labelbox links its terms of service and provides no separate leaderboard license. https://docs.labelbox.com/page/terms-of-service The robots.txt restrictions cover CGI and PDF paths.",
  async fetch() {
    const data = await labelboxData(FEED, 'echochain');
    const rows = (data.overall as LabelboxRow[]).map((r) => {
      const original = data.info.overall.find((v: { model: string }) => v.model === r.model);
      if (!r.label || !original || !Number.isFinite(r.elo) || Math.abs(r.elo - original.score * 100) > 0.001) throw new Error('Invalid EchoChain score');
      return { model: r.label, score: r.elo };
    });
    if (rows.length < 4) throw new Error('Expected four voice agents');
    return rows;
  },
};
export default board;
