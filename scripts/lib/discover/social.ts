// Bluesky: launch announcements from labs, evaluators and the tech press. Many launches start as an X thread,
// and X's terms forbid scraping, so it has no reader. Labs and evaluators often post the same thread on Bluesky
// (Ai2's StateBench, Prosaic Intelligence's Suicide Memory Bench), and Techmeme posts its headlines there.
// The AppView's public search API needs no account.
import { key } from '../util.ts';
import { FROM, GENERAL, NICHE, launchNames, arxivId, githubRepo, type Reader } from './core.ts';

// searches for launch wording. Each returns a few dozen posts over three days, so three pages cover them.
const QUERIES = ['new benchmark', 'releasing benchmark', 'introducing benchmark', 'launches benchmark', 'benchmark launch', 'new eval', 'releasing bench', 'introducing eval'];
// accounts that repost X posts: their text is X's, which we do not take
const MIRROR = /extwitter|twitter|xchatter|\.mir-|mir-rt|bird\.makeup|nitter|xcancel/i;
// Techmeme's editors pick its headlines, so one counts as a curated mention
const TECHMEME = /^techmeme\.com$/;
// the maker in press wording: "OpenAI unveils LifeVal", "SemiAnalysis launches GDPx"
const maker = (text: string, name: string) =>
  text.match(new RegExp(String.raw`([A-Z][\w&.-]+(?:\s[A-Z][\w&.-]+)?)\s+(?:has\s+|have\s+)?(?:launch|releas|unveil|introduc|announc|debut)\w*\s+${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\b`))?.[1];

interface Post {
  uri: string;
  likeCount?: number;
  author: { handle: string; displayName?: string };
  record: {
    text?: string;
    createdAt?: string;
    facets?: { features: { uri?: string }[] }[];
    embed?: { external?: { uri?: string } };
  };
}

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function bluesky(r: Reader) {
  const posts = new Map<string, Post>();
  const refused: string[] = [];
  for (const q of QUERIES) {
    let cursor: string | undefined;
    for (let page = 0; page < 3; page++) {
      // the search API refuses bursts (HTTP 403), so requests go one every 1.5 s, and a refused search moves on
      await pause(1500);
      const u = new URL('https://api.bsky.app/xrpc/app.bsky.feed.searchPosts');
      u.search = new URLSearchParams({ q, limit: '100', sort: 'latest', since: `${FROM}T00:00:00Z`, ...(cursor ? { cursor } : {}) }).toString();
      const d = await r.json<{ posts?: Post[]; cursor?: string }>(u.toString()).catch((e: Error) => {
        if (r.signal.aborted || !/HTTP 403/.test(e.message)) throw e;
        refused.push(page ? `${q} (page ${page + 1})` : q);
        return {} as { posts?: Post[]; cursor?: string };
      });
      for (const p of d.posts ?? []) posts.set(p.uri, p);
      cursor = d.cursor;
      if (!cursor || !d.posts?.length) break;
    }
  }
  if (refused.length) r.note(`refused: ${refused.join(', ')}`);
  if (!posts.size) throw new Error('every search was refused');
  r.read(posts.size);
  // one find per name, with every post that announced it
  const found = new Map<string, { name: string; posts: Post[] }>();
  for (const p of posts.values()) {
    if (MIRROR.test(p.author.handle)) continue;
    for (const nm of launchNames(p.record.text ?? '')) {
      const f = found.get(key(nm)) ?? { name: nm, posts: [] };
      f.posts.push(p);
      found.set(key(nm), f);
    }
  }
  for (const { name, posts: ps } of found.values()) {
    // the most-liked post stands for the find. A first-person post ("we're releasing") is the maker's own.
    ps.sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
    const own = ps.find((p) => /\b(?:we(?:'|’)re|we are|we|our)\s+(?:\w+\s+){0,2}?(?:releas|introduc|launch|new)/i.test(p.record.text ?? ''));
    const top = own ?? ps[0];
    const text = ps.map((p) => p.record.text ?? '').join('\n');
    const links = ps.flatMap((p) => [...(p.record.facets ?? []).flatMap((f) => f.features.map((x) => x.uri ?? '')), p.record.embed?.external?.uri ?? '']).filter(Boolean);
    const repo = links.map((l) => githubRepo(l)).find((x) => x && key(x.split('/').pop() ?? '').includes(key(name).slice(0, 6)));
    r.add(
      {
        key: key(name),
        name,
        title: (top.record.text ?? name).replace(/\s+/g, ' ').slice(0, 160),
        url: `https://bsky.app/profile/${top.author.handle}/post/${top.uri.split('/').pop()}`,
        org: own?.author.displayName ?? ps.map((p) => maker(p.record.text ?? '', name)).find(Boolean),
        arxiv: links.map((l) => arxivId(l)).find(Boolean),
        repo,
        upvotes: ps.reduce((n, p) => n + (p.likeCount ?? 0), 0),
        introduced: true,
        stageA: 5,
        general: GENERAL.test(text),
        niche: NICHE.test(text),
      },
      { feed: 'bluesky' },
    );
    const tm = ps.find((p) => TECHMEME.test(p.author.handle));
    if (tm) r.add({ key: key(name), name, title: name, url: `https://bsky.app/profile/${tm.author.handle}/post/${tm.uri.split('/').pop()}`, stageA: 5 }, { curated: { source: 'Techmeme', url: `https://bsky.app/profile/${tm.author.handle}/post/${tm.uri.split('/').pop()}` } });
  }
}
