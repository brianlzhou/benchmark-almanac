// Leaderboards the almanac links to but does not read, and why. A benchmark page with no scores names the
// reason and sends the reader to the live board.
const BY_HOST: Record<string, string> = {
  'yupp.ai': 'Yupp blocks automated reading, so we link to its board instead.',
  'artificialanalysis.ai': 'Artificial Analysis doesn’t allow reuse of its data, so we link to its board instead.',
};

export function host(url: string | undefined): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export const unreadWhy = (url: string | undefined) => BY_HOST[host(url)];
