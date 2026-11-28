// The /index/ page script. The server draws the current version, so nothing here runs on load except wiring. The
// first time a reader points at a control, the script fetches /index/data.json, and every switch (a version, a
// sort, Show all, a domain, a model) redraws its part of the page from it with the same markup the server used
// (src/components/almanac-index/render.ts). A version shows in the address as #v26-11.
import * as R from '../components/almanac-index/render.ts';

const root = document.querySelector<HTMLElement>('.ix-page');
if (root) init(root);

function init(root: HTMLElement) {
  const $ = (id: string) => document.getElementById(id);
  let all: R.Payload | null = null;
  let loading: Promise<R.Payload> | null = null;
  const load = () =>
    (loading ??= fetch('/index/data.json')
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<R.Payload>;
      })
      .then((p) => (all = p))
      .catch((err) => {
        loading = null;
        throw err;
      }));
  // fetch when a reader reaches for a control, so a reader who only reads never downloads the boards
  const warm = (e: Event) => {
    if ((e.target as Element).closest?.('button')) load().catch(() => {});
  };
  root.addEventListener('pointerover', warm, { passive: true });
  root.addEventListener('focusin', warm);
  root.addEventListener('touchstart', warm, { passive: true });

  let v = root.dataset.main ?? '';
  const state: R.State = { sortKey: 'rank', lbOpen: false, domain: root.dataset.domain ?? '', who: root.dataset.who ?? '', rankOpen: false };
  const ctx = () => R.ctxOf(all!, v);
  const set = (id: string, html: string) => {
    const el = $(id);
    if (el) el.innerHTML = html;
  };
  const text = (id: string, t: string) => {
    const el = $(id);
    if (el) el.textContent = t;
  };

  function drawTable(c = ctx()) {
    set('ix-lb', R.table(c, state));
    const more = $('ix-lb-more');
    if (more) {
      more.hidden = c.P.headline.rows.length <= R.LB_TOP;
      more.textContent = R.moreText(c, state);
    }
  }
  function drawBoard(c = ctx()) {
    set('ix-board', R.board(c, state.domain));
  }
  function drawProfile(c = ctx()) {
    text('ix-cap-models', R.modelsCaption(c, state.who));
    set('ix-prof', R.profile(c, state.who));
  }
  function drawRanking(c = ctx()) {
    set('ix-rank', R.ranking(c, state.rankOpen));
    const more = $('ix-rank-more');
    if (more) {
      more.hidden = c.P.ranking.length <= R.RANK_TOP;
      more.textContent = R.rankMoreText(c, state.rankOpen);
    }
  }
  function drawAll() {
    const c = ctx();
    state.domain = R.defaultDomain(c, state.domain);
    state.who = R.defaultWho(c, state.who);
    text('ix-title', R.title(c));
    set('ix-lede', R.lede(c));
    set('ix-vseg', R.versionSeg(c));
    text('ix-vnote', R.versionNote(c));
    set('ix-facts', R.facts(c));
    text('ix-cap-overall', R.overallCaption(c));
    drawTable(c);
    text('ix-cap-changes', R.changesCaption(c));
    set('ix-chg', R.changes(c));
    text('ix-cap-domains', R.domainsCaption(c));
    set('ix-groups', R.cards(c, state.domain));
    drawBoard(c);
    set('ix-chips', R.chips(c, state.who));
    drawProfile(c);
    set('ix-heat', R.heat(c));
    text('ix-cap-tests', R.testsCaption(c));
    drawRanking(c);
    set('ix-how', R.how(c));
    set('ix-limits', R.limits(c));
  }
  const press = (sel: string, attr: string, value: string) =>
    root.querySelectorAll<HTMLElement>(sel).forEach((x) => x.setAttribute('aria-pressed', String(x.dataset[attr] === value)));

  // every control waits for the data, then acts
  const act = (fn: () => void) => {
    load()
      .then(fn)
      .catch(() => {
        text('ix-vnote', 'The index data did not load. Reload the page to try again.');
      });
  };
  const toVersion = (next: string) => {
    if (!all?.versions[next] || next === v) return;
    v = next;
    try {
      history.replaceState(null, '', next === all.main ? location.pathname : `#v${next.replace('.', '-')}`);
    } catch {
      // some frames refuse address changes
    }
    drawAll();
  };

  $('ix-vseg')?.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('button[data-v]');
    if (b) act(() => toVersion(b.dataset.v!));
  });
  $('ix-lb')?.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('thead button[data-k]');
    if (!b) return;
    act(() => {
      state.sortKey = b.dataset.k!;
      drawTable();
    });
  });
  $('ix-lb-more')?.addEventListener('click', () =>
    act(() => {
      state.lbOpen = !state.lbOpen;
      drawTable();
    }),
  );
  $('ix-groups')?.addEventListener('click', (e) => {
    const card = (e.target as Element).closest<HTMLElement>('button.ix-card[data-d]');
    if (!card) return;
    act(() => {
      state.domain = card.dataset.d!;
      press('button.ix-card[data-d]', 'd', state.domain);
      drawBoard();
      const board = $('ix-board');
      if (board && board.getBoundingClientRect().top > window.innerHeight - 120) board.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    });
  });
  $('ix-chips')?.addEventListener('click', (e) => {
    const chip = (e.target as Element).closest<HTMLElement>('button.ix-chip[data-m]');
    if (!chip) return;
    act(() => {
      state.who = chip.dataset.m!;
      press('button.ix-chip[data-m]', 'm', state.who);
      drawProfile();
    });
  });
  $('ix-rank-more')?.addEventListener('click', () =>
    act(() => {
      state.rankOpen = !state.rankOpen;
      drawRanking();
    }),
  );

  // a link to another version (#v26-10) opens on it
  const h = location.hash.match(/^#v(\d\d)-(\d\d)$/);
  if (h && `${h[1]}.${h[2]}` !== v) act(() => toVersion(`${h[1]}.${h[2]}`));
}
