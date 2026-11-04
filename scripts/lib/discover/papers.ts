// Paper feeds: Hugging Face Daily Papers, the arXiv API, and the NeurIPS Evaluations and Datasets track on OpenReview.
import { noteAudit } from './audits.ts';
import { key, daysAgo } from '../util.ts';
import { DAYS, FROM, TODAY, GENERAL, NICHE, stageA, paperName, isoDate, githubRepo, type Reader } from './core.ts';
import { decode } from './text.ts';

export async function hfDailyPapers(r: Reader) {
  type P = { paper: { id: string; title: string; summary: string; upvotes?: number; githubRepo?: string; githubStars?: number; organization?: { name?: string; fullname?: string } }; title?: string; summary?: string };
  for (let d = 0; d <= DAYS; d++) {
    const list = await r.json<P[]>(`https://huggingface.co/api/daily_papers?date=${daysAgo(d)}&limit=100`).catch(() => [] as P[]);
    r.read(list.length);
    for (const it of list) {
      const p = it.paper;
      const title = it.title ?? p.title;
      const abs = it.summary ?? p.summary ?? '';
      // a paper that audits a cataloged benchmark goes to its own queue, whatever its Stage A score
      noteAudit({ key: `https://arxiv.org/abs/${p.id}`, title, text: abs, url: `https://arxiv.org/abs/${p.id}`, source: 'Hugging Face papers', date: daysAgo(d) });
      const a = stageA(title, abs, !!p.githubRepo);
      if (a < 5) continue;
      const name = paperName(title, abs);
      r.add(
        {
          key: p.id,
          name,
          introduced: name !== title,
          title,
          url: `https://huggingface.co/papers/${p.id}`,
          arxiv: p.id,
          org: p.organization?.fullname ?? p.organization?.name,
          repo: p.githubRepo,
          upvotes: p.upvotes,
          stars: p.githubStars,
          stageA: a,
          general: GENERAL.test(`${title} ${abs}`),
          niche: NICHE.test(`${title} ${abs}`),
        },
        { feed: 'hf' },
      );
    }
  }
}

export async function arxiv(r: Reader) {
  // the arXiv API terms ask for one query a day and no more than one request every three seconds
  const q = `(ti:benchmark OR abs:benchmark) AND (cat:cs.CL OR cat:cs.AI OR cat:cs.LG OR cat:cs.SE) AND submittedDate:[${FROM.replace(/-/g, '')}0000 TO ${TODAY.replace(/-/g, '')}2359]`;
  const url = `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(q)}&sortBy=submittedDate&sortOrder=descending&max_results=500`;
  const xml = await r.text(url, { timeout: 60_000, tries: 4, wait: 5000 });
  const text = (s: string) => decode(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
  for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const e = m[1];
    const id = (e.match(/<id>https?:\/\/arxiv\.org\/abs\/([^<v]+)/) ?? [])[1];
    const title = text((e.match(/<title>([\s\S]*?)<\/title>/) ?? [])[1] ?? '');
    const abs = text((e.match(/<summary>([\s\S]*?)<\/summary>/) ?? [])[1] ?? '');
    if (!id || !title) continue;
    r.read();
    noteAudit({ key: `https://arxiv.org/abs/${id}`, title, text: abs, url: `https://arxiv.org/abs/${id}`, source: 'arXiv', date: (e.match(/<published>(\d{4}-\d\d-\d\d)/) ?? [])[1] });
    const a = stageA(title, abs, /github\.com|huggingface\.co\/datasets/.test(e));
    if (a < 5) continue;
    const repo = githubRepo((abs.match(/https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/) ?? [])[0]?.replace(/[.)]+$/, '') ?? '');
    r.add(
      { key: id, name: paperName(title, abs), introduced: paperName(title, abs) !== title, title, url: `https://arxiv.org/abs/${id}`, arxiv: id, repo, stageA: a, general: GENERAL.test(`${title} ${abs}`), niche: NICHE.test(`${title} ${abs}`) },
      { feed: 'arxiv' },
    );
  }
}

/**
 * Accepted papers in the NeurIPS Evaluations and Datasets track. OpenReview's API needs a signed-in
 * account for paper queries (its terms put paper metadata under CC0), so this reader runs only when
 * OPENREVIEW_USERNAME and OPENREVIEW_PASSWORD are set. Decisions arrive in one batch each autumn, so
 * the reader keeps the list of accepted papers and reports the ones it has not seen.
 */
export async function openreview(r: Reader) {
  const id = process.env.OPENREVIEW_USERNAME;
  const password = process.env.OPENREVIEW_PASSWORD;
  if (!id || !password) {
    r.note('skipped: needs an OpenReview account (OPENREVIEW_USERNAME, OPENREVIEW_PASSWORD)');
    return;
  }
  const API = 'https://api2.openreview.net';
  const { token } = await r.json<{ token: string }>(`${API}/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, password }), tries: 1 });
  const auth = { authorization: `Bearer ${token}` };
  // the track's name changes over the years (Datasets and Benchmarks, then Evaluations and Datasets)
  const year = Number(TODAY.slice(0, 4));
  type G = { groups: { id: string }[] };
  const groups = await r.json<G>(`${API}/groups?parent=NeurIPS.cc/${year}`, { headers: auth });
  const tracks = groups.groups.map((g) => g.id).filter((g) => /\/(Evaluations|Datasets)[\w]*Track$/i.test(g));
  type N = { id: string; pdate?: number; cdate?: number; content: Record<string, { value?: unknown }> };
  const notes: N[] = [];
  for (const venue of tracks)
    for (let offset = 0; offset < 5000; offset += 1000) {
      const page = await r.json<{ notes: N[] }>(`${API}/notes?content.venueid=${encodeURIComponent(venue)}&limit=1000&offset=${offset}`, { headers: auth, timeout: 60_000 });
      notes.push(...page.notes);
      if (page.notes.length < 1000) break;
    }
  r.read(notes.length);
  const ids = notes.map((n) => n.id);
  const fresh = new Set(await r.fresh('openreview', ids, async () => notes.filter((n) => isoDate(new Date(n.pdate ?? n.cdate ?? 0).toISOString()) < FROM).map((n) => n.id)));
  for (const n of notes) {
    if (!fresh.has(n.id)) continue;
    const title = String(n.content.title?.value ?? '');
    const abs = String(n.content.abstract?.value ?? '');
    const a = stageA(title, abs, /github\.com|huggingface\.co/.test(abs));
    if (!title || a < 5) continue;
    const repo = githubRepo((abs.match(/https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/) ?? [])[0]?.replace(/[.)]+$/, '') ?? '');
    r.add(
      { key: key(paperName(title, abs)) || n.id, name: paperName(title, abs), introduced: paperName(title, abs) !== title, title, url: `https://openreview.net/forum?id=${n.id}`, repo, stageA: a, general: GENERAL.test(`${title} ${abs}`), niche: NICHE.test(`${title} ${abs}`) },
      { feed: 'NeurIPS Evaluations and Datasets track' },
    );
  }
  r.remember('openreview', ids);
}
